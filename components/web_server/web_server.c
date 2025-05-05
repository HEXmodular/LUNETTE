#include "web_server.h"
#include "api_registry.h"
#include "oscillator_handler.h"

#include <string.h>
#include "esp_log.h"
#include "esp_http_server.h"
#include "cJSON.h"

static const char *TAG = "web_server";
static httpd_handle_t server = NULL;

// Helper function to send file content
static esp_err_t send_file_content(httpd_req_t *req, const char *file_path)
{
    ESP_LOGD(TAG, "Opening file: %s", file_path);
    
    extern const unsigned char index_html_start[] asm("_binary_index_html_start");
    extern const unsigned char index_html_end[]   asm("_binary_index_html_end");
    extern const unsigned char scripts_js_start[]  asm("_binary_scripts_js_start");
    extern const unsigned char scripts_js_end[]    asm("_binary_scripts_js_end");
    extern const unsigned char value_control_js_start[]  asm("_binary_value_control_js_start");
    extern const unsigned char value_control_js_end[]    asm("_binary_value_control_js_end");
    extern const unsigned char style_css_start[]  asm("_binary_style_css_start");
    extern const unsigned char style_css_end[]    asm("_binary_style_css_end");
    extern const unsigned char value_control_css_start[]  asm("_binary_value_control_css_start");
    extern const unsigned char value_control_css_end[]    asm("_binary_value_control_css_end");
    
    const unsigned char *start = NULL;
    const unsigned char *end = NULL;
    esp_err_t err = ESP_OK;
    
    // Determine which embedded file to serve
    if (strcmp(file_path, "index.html") == 0) {
        start = index_html_start;
        end = index_html_end;
        httpd_resp_set_type(req, "text/html");
    } else if (strcmp(file_path, "scripts.js") == 0) {
        start = scripts_js_start;
        end = scripts_js_end;
        httpd_resp_set_type(req, "application/javascript");
    } else if (strcmp(file_path, "value-control.js") == 0) {
        start = value_control_js_start;
        end = value_control_js_end;
        httpd_resp_set_type(req, "application/javascript");
    } else if (strcmp(file_path, "style.css") == 0) {
        start = style_css_start;
        end = style_css_end;
        httpd_resp_set_type(req, "text/css");
    } else if (strcmp(file_path, "value-control.css") == 0) {
        start = value_control_css_start;
        end = value_control_css_end;
        httpd_resp_set_type(req, "text/css");
    } else {
        ESP_LOGE(TAG, "File not found: %s", file_path);
        return ESP_FAIL;
    }
    // Send the file content
    ESP_LOGD(TAG, "File found");
    if (start && end) {
        size_t file_size = end - start;
        ESP_LOGD(TAG, "File size: %zu bytes", file_size);
        err = httpd_resp_send(req, (const char *)start, file_size);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Error sending file: %s", esp_err_to_name(err));
        }
    } else {
        ESP_LOGE(TAG, "File content not found");
        err = ESP_FAIL;
    }
    
    return err;
}

// Handler for root path
static esp_err_t root_handler(httpd_req_t *req)
{
    ESP_LOGD(TAG, "GET /");
    ESP_LOGD(TAG, "Request headers:");
    //ESP_LOGD(TAG, "  Host: %s", req->host);
    //ESP_LOGD(TAG, "  User-Agent: %s", req->user_agent);
    
    // Set response headers
    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate");
    
    // Send index.html
    ESP_LOGD(TAG, "Sending index.html");
    esp_err_t err = send_file_content(req, "index.html");
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to send index.html: %s", esp_err_to_name(err));
    }
    return err;
}

// Handler for static files
static esp_err_t static_handler(httpd_req_t *req)
{
    const char *uri = req->uri;
    const char *file_path = uri + 1; // Skip leading '/'
    ESP_LOGI(TAG, "GET %s", uri);
    ESP_LOGI(TAG, "Request headers:");
    //ESP_LOGI(TAG, "  Host: %s", req->host);
    //ESP_LOGI(TAG, "  User-Agent: %s", req->user_agent);

    // Set content type based on file extension
    const char *content_type = "text/plain";
    if (strstr(file_path, ".js")) {
        content_type = "application/javascript";
    } else if (strstr(file_path, ".css")) {
        content_type = "text/css";
    } else if (strstr(file_path, ".html")) {
        content_type = "text/html";
    } else if (strstr(file_path, ".png")) {
        content_type = "image/png";
    } else if (strstr(file_path, ".jpg") || strstr(file_path, ".jpeg")) {
        content_type = "image/jpeg";
    }
    ESP_LOGI(TAG, "Content-Type: %s", content_type);

    // Set response headers
    httpd_resp_set_type(req, content_type);
    httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000");

    // Send file
    ESP_LOGI(TAG, "Sending file: %s", file_path);
    esp_err_t err = send_file_content(req, file_path);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to send file %s: %s", file_path, esp_err_to_name(err));
    }
    return err;
}

// URI matching function with logging
static bool uri_match_fn(const char *reference_uri, const char *uri_to_match, size_t match_upto)
{
    ESP_LOGD(TAG, "Matching URI - Reference: %s, To Match: %s, Match Length: %zu", 
             reference_uri, uri_to_match, match_upto);
    
    // Handle wildcard pattern
    const char *wildcard = strchr(reference_uri, '*');
    if (wildcard != NULL) {
        size_t prefix_len = wildcard - reference_uri;
        // If we have a length limit, use it
        if (match_upto > 0) {
            prefix_len = (prefix_len < match_upto) ? prefix_len : match_upto;
        }
        // Match the part before wildcard
        bool match = (strncmp(reference_uri, uri_to_match, prefix_len) == 0);
        ESP_LOGD(TAG, "Wildcard match - Prefix length: %zu, Result: %s", prefix_len, match ? "true" : "false");
        return match;
    }
    
    // No wildcard, do normal matching
    bool match = false;
    if (match_upto == 0) {
        match = (strcmp(reference_uri, uri_to_match) == 0);
    } else {
        match = (strncmp(reference_uri, uri_to_match, match_upto) == 0);
    }
    
    ESP_LOGD(TAG, "URI Match Result: %s", match ? "true" : "false");
    return match;
}

// Start web server with custom configuration
httpd_handle_t start_webserver(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.lru_purge_enable = true;
    config.uri_match_fn = uri_match_fn;  // Set our custom URI matching function

    ESP_LOGI(TAG, "Starting server on port: '%d'", config.server_port);
    
    esp_err_t err = httpd_start(&server, &config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Error starting server!");
        return NULL;
    }

    //URI handler for root path
    httpd_uri_t root_uri = {
        .uri       = "/",
        .method    = HTTP_GET,
        .handler   = root_handler,
        .user_ctx  = NULL
    };
    httpd_register_uri_handler(server, &root_uri);

    // Initialize API registry
    err = api_registry_init(server);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Error initializing API registry!");
        httpd_stop(server);
        return NULL;
    }

    // URI handler for static files
    httpd_uri_t static_uri = {
        .uri       = "/*",
        .method    = HTTP_GET,
        .handler   = static_handler,
        .user_ctx  = NULL
    };
    httpd_register_uri_handler(server, &static_uri);

    ESP_LOGI(TAG, "Server started successfully");
    return server;
}

// Initialize and start web server
esp_err_t web_server_init(void)
{
    ESP_LOGD(TAG, "Initializing web server...");
    
    // Set log level to DEBUG to enable LOGD messages
    esp_log_level_set(TAG, ESP_LOG_DEBUG);
    ESP_LOGD(TAG, "Debug logging enabled");
    
    if (server != NULL) {
        ESP_LOGW(TAG, "Web server already running");
        return ESP_OK;
    }

    // Start web server with configuration
    server = start_webserver();
    if (server == NULL) {
        ESP_LOGE(TAG, "Failed to start web server");
        return ESP_FAIL;
    }

    return ESP_OK;
}

// Stop and deinitialize web server
esp_err_t web_server_deinit(void)
{
    ESP_LOGD(TAG, "Deinitializing web server...");
    if (server == NULL) {
        ESP_LOGW(TAG, "Web server not running");
        return ESP_OK;
    }

    esp_err_t err = stop_webserver(server);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to stop server: %s", esp_err_to_name(err));
        return err;
    }

    server = NULL;
    ESP_LOGD(TAG, "Web server stopped successfully");
    return ESP_OK;
}
