idf_component_register(
    SRCS "web_server.c"
    INCLUDE_DIRS "include"
    REQUIRES 
        "esp_http_server"
        "esp_wifi"
        "esp_event"        
        "esp_system"
        "nvs_flash"
        "esp_netif"
        "esp_eth"
        "esp_timer"
        "json"
        "api"
        "common_defs"
        "esp_http_client"
        "esp_websocket_client"
        "output"
        "esp_https_server"
        "mdns"
    EMBED_FILES 
        "static/index.html" 
        "static/scripts.js" 
        "static/value-control.js" 
        "static/value-control.css" 
        "static/style.css"
        "static/audio-effects.js"
        "static/audio-worklet.js"
    EMBED_TXTFILES
        "certs/certificate.pem"
        "certs/private_key.pem"
)