<?php
defined('MOODLE_INTERNAL') || die();

$definitions = [
    'sudaridentity' => [
        'mode' => cache_store::MODE_APPLICATION,
        'simplekeys' => true,
        'simpledata' => true,
        'ttl' => 3600,
    ],
];
