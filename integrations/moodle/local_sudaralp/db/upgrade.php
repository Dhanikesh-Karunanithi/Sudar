<?php

defined('MOODLE_INTERNAL') || die();

/**
 * @param int $oldversion
 * @return bool
 */
function xmldb_local_sudaralp_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();
    $table = new xmldb_table('local_sudaralp_q');

    if ($oldversion < 2026042710) {
        $field = new xmldb_field('attempt_count', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('next_attempt_at', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('last_error', XMLDB_TYPE_TEXT, 'small', null, null, null, null);
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('status', XMLDB_TYPE_CHAR, '16', null, XMLDB_NOTNULL, null, 'pending');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2026042710, 'local', 'sudaralp');
    }

    return true;
}
