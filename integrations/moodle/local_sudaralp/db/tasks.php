<?php
defined('MOODLE_INTERNAL') || die();

$tasks = [
    [
        'classname' => '\local_sudaralp\task\push_queue',
        'blocking' => 0,
        'minute' => '*/2',
        'hour' => '*',
        'day' => '*',
        'dayofweek' => '*',
        'month' => '*',
    ],
];
