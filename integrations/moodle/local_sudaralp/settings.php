<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_sudaralp', get_string('settings', 'local_sudaralp'));

    $settings->add(new admin_setting_configtext(
        'local_sudaralp/learnbaseurl',
        get_string('learnbaseurl', 'local_sudaralp'),
        get_string('learnbaseurl_desc', 'local_sudaralp'),
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_sudaralp/apikey',
        get_string('apikey', 'local_sudaralp'),
        get_string('apikey_desc', 'local_sudaralp'),
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_sudaralp/identityprovider',
        get_string('identityprovider', 'local_sudaralp'),
        get_string('identityprovider_desc', 'local_sudaralp'),
        'moodle',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configduration(
        'local_sudaralp/identitycachettl',
        get_string('identitycachettl', 'local_sudaralp'),
        get_string('identitycachettl_desc', 'local_sudaralp'),
        3600
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_sudaralp/identityfailclosed',
        get_string('identityfailclosed', 'local_sudaralp'),
        get_string('identityfailclosed_desc', 'local_sudaralp'),
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_sudaralp/enableevents',
        get_string('enableevents', 'local_sudaralp'),
        get_string('enableevents_desc', 'local_sudaralp'),
        1
    ));

    $ADMIN->add('localplugins', $settings);
}
