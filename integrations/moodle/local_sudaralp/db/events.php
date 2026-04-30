<?php
defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname' => '\core\event\course_module_completion_updated',
        'callback' => '\local_sudaralp\observer::course_module_completion_updated',
    ],
    [
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => '\local_sudaralp\observer::quiz_attempt_submitted',
    ],
];
