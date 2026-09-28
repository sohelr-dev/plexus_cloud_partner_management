<?php

return [

    /*
    Cross-Origin Resource Sharing (CORS) Configuration
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // React dev server + production frontend (FRONTEND_URL in .env)
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://plexus.sohelit.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],


    'max_age' => 0,

    // Sanctum SPA cookie auth
    'supports_credentials' => true,

];
