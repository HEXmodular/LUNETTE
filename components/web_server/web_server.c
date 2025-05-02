#include <string.h>
#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_vfs.h"
#include "cJSON.h"
#include "web_server.h"
#include "api.h"

//TODO переписать нафиг всю работу с путями

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
    ESP_LOGD(TAG, "GET %s", uri);
    ESP_LOGD(TAG, "Request headers:");
    //ESP_LOGD(TAG, "  Host: %s", req->host);
    //ESP_LOGD(TAG, "  User-Agent: %s", req->user_agent);

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
    ESP_LOGD(TAG, "Content-Type: %s", content_type);

    // Set response headers
    httpd_resp_set_type(req, content_type);
    httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000");

    // Send file
    ESP_LOGD(TAG, "Sending file: %s", file_path);
    esp_err_t err = send_file_content(req, file_path);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to send file %s: %s", file_path, esp_err_to_name(err));
    }
    return err;
}

// Handler for API data
static esp_err_t api_data_handler_get(httpd_req_t *req)
{
    ESP_LOGD(TAG, "GET /api/oscillator");
    ESP_LOGD(TAG, "Request headers:");
    //ESP_LOGD(TAG, "  Host: %s", req->host);
    //ESP_LOGD(TAG, "  User-Agent: %s", req->user_agent);

    // Create JSON response
    ESP_LOGD(TAG, "Creating JSON response");
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        return ESP_FAIL;
    }

    // Add sensor data to JSON
    ESP_LOGD(TAG, "Adding oscillator data to JSON");
    cJSON_AddNumberToObject(root, "frequency", oscillator_data.frequency);
    cJSON_AddNumberToObject(root, "amplitude", oscillator_data.amplitude);


    // Convert JSON to string
    ESP_LOGD(TAG, "Converting JSON to string");
    char *response = cJSON_Print(root);
    if (response == NULL) {
        ESP_LOGE(TAG, "Failed to print JSON");
        cJSON_Delete(root);
        return ESP_FAIL;
    }
    ESP_LOGD(TAG, "JSON response: %s", response);

    // Set response headers
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate");

    // Send response
    ESP_LOGD(TAG, "Sending JSON response");
    esp_err_t err = httpd_resp_send(req, response, strlen(response));
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to send response: %s", esp_err_to_name(err));
    }

    // Cleanup
    free(response);
    cJSON_Delete(root);
    return err;
}

static esp_err_t api_data_handler_post(httpd_req_t *req)
{
    ESP_LOGD(TAG, "POST /api/oscillator");
    //ESP_LOGD(TAG, "Request headers:");
    //ESP_LOGD(TAG, "  Host: %s", req->host);
    //ESP_LOGD(TAG, "  User-Agent: %s", req->user_agent);


    int total_len = req->content_len;
    ESP_LOGD(TAG, "Total length: %d", total_len);
    
        /* Destination buffer for content of HTTP POST request.
     * httpd_req_recv() accepts char* only, but content could
     * as well be any binary data (needs type casting).
     * In case of string data, null termination will be absent, and
     * content length would give length of string */
    char content[100];

    /* Truncate if content length larger than the buffer */
    size_t recv_size = (req->content_len < sizeof(content)) ? req->content_len : sizeof(content);
    ESP_LOGD(TAG, "Recv size: %d", recv_size);

    int ret = httpd_req_recv(req, content, recv_size);
    if (ret <= 0) {  /* 0 return value indicates connection closed */
        /* Check if timeout occurred */
        if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
            /* In case of timeout one can choose to retry calling
             * httpd_req_recv(), but to keep it simple, here we
             * respond with an HTTP 408 (Request Timeout) error */
            httpd_resp_send_408(req);
            ESP_LOGE(TAG, "Request timeout");
        }
        /* In case of error, returning ESP_FAIL will
         * ensure that the underlying socket is closed */
        return ESP_FAIL;
        ESP_LOGE(TAG, "Request error");
    }

    cJSON *root = cJSON_Parse(content);

    // Get the frequency and amplitude from the request data
    double frequency = cJSON_GetObjectItem(root, "frequency")->valuedouble;
    double amplitude = cJSON_GetObjectItem(root, "amplitude")->valuedouble;
    ESP_LOGD(TAG, "Oscillator data: frequency = %f, amplitude = %f", frequency, amplitude);

    // Update the oscillator data
    update_oscillator_data(frequency, amplitude);

    cJSON_Delete(root);
    httpd_resp_sendstr(req, "Post control value successfully");

    // Send the response
    return ESP_OK;
}

// Start web server with custom configuration
httpd_handle_t start_webserver(const web_server_config_t *config)
{
    ESP_LOGD(TAG, "Starting web server...");
    ESP_LOGD(TAG, "Configuration:");
    ESP_LOGD(TAG, "  Port: %d", config->port);
    ESP_LOGD(TAG, "  Max URI handlers: %d", config->max_uri_handlers);
    ESP_LOGD(TAG, "  Max response headers: %d", config->max_resp_headers);
    ESP_LOGD(TAG, "  Max request headers length: %d", config->max_req_headers_len);
    ESP_LOGD(TAG, "  Max URI length: %d", config->max_uri_len);
    ESP_LOGD(TAG, "  Max POST length: %d", config->max_post_len);
    ESP_LOGD(TAG, "  Max output headers: %d", config->max_out_headers);
    ESP_LOGD(TAG, "  Max session contexts: %d", config->max_sess_ctx);
    ESP_LOGD(TAG, "  Max open sockets: %d", config->max_open_sockets);
    ESP_LOGD(TAG, "  Backlog connections: %d", config->backlog_conn);
    ESP_LOGD(TAG, "  LRU purge enabled: %s", config->lru_purge_enable ? "yes" : "no");
    ESP_LOGD(TAG, "  Receive timeout: %d", config->recv_wait_timeout);
    ESP_LOGD(TAG, "  Send timeout: %d", config->send_wait_timeout);

    if (server != NULL) {
        ESP_LOGW(TAG, "Web server already running");
        return server;
    }

    // Configure HTTP server
    httpd_config_t http_config = HTTPD_DEFAULT_CONFIG();
    http_config.max_uri_handlers = config->max_uri_handlers;
    http_config.max_resp_headers = config->max_resp_headers;
    //http_config.max_req_headers_len = config->max_req_headers_len;
    //http_config.max_uri_len = config->max_uri_len;
    //http_config.max_post_len = config->max_post_len;
    //http_config.max_out_headers = config->max_out_headers;
    //http_config.max_sess_ctx = config->max_sess_ctx;
    http_config.max_open_sockets = config->max_open_sockets;
    http_config.backlog_conn = config->backlog_conn;
    http_config.lru_purge_enable = config->lru_purge_enable;
    http_config.recv_wait_timeout = config->recv_wait_timeout;
    http_config.send_wait_timeout = config->send_wait_timeout;
    http_config.stack_size = 8192;

    // Start HTTP server
    ESP_LOGD(TAG, "Starting HTTP server...");
    esp_err_t err = httpd_start(&server, &http_config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start server: %s", esp_err_to_name(err));
        return NULL;
    }

    // Register URI handlers
    ESP_LOGD(TAG, "Registering URI handlers...");
    
    // Root handler
    httpd_uri_t uri_get = {
        .uri = "/",
        .method = HTTP_GET,
        .handler = root_handler,
        .user_ctx = NULL
    };
    err = httpd_register_uri_handler(server, &uri_get);

    // Define array of URIs
    const char* uris[] = {
        "/value-control.js",
        "/scripts.js",
        "/style.css", 
        "/value-control.css"
    };

    // Register static file handlers
    for (int i = 0; i < sizeof(uris)/sizeof(uris[0]); i++) {
        httpd_uri_t uri_handler = {
            .uri = uris[i],
            .method = HTTP_GET,
            .handler = static_handler,
            .user_ctx = NULL
        };
        err = httpd_register_uri_handler(server, &uri_handler);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Failed to register handler for %s: %s", 
                     uris[i], esp_err_to_name(err));
        }
    }

    // API handler
    httpd_uri_t api_get = {
        .uri = "/api/oscillator",
        .method = HTTP_GET,
        .handler = api_data_handler_get,
        .user_ctx = NULL
    };

    httpd_uri_t api_post = {
        .uri = "/api/oscillator",
        .method = HTTP_POST,
        .handler = api_data_handler_post,
        .user_ctx = NULL
    };
    
    err = httpd_register_uri_handler(server, &api_get);
    err = httpd_register_uri_handler(server, &api_post);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register API handler: %s", esp_err_to_name(err));
        httpd_stop(server);
        server = NULL;
        return NULL;
    }

    ESP_LOGD(TAG, "Web server started successfully");
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

    // Create default configuration
    web_server_config_t config = WEB_SERVER_DEFAULT_CONFIG();
    
    // Start web server with configuration
    server = start_webserver(&config);
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
