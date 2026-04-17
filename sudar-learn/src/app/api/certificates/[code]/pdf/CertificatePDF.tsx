/**
 * Server-only certificate PDF layout for @react-pdf/renderer.
 * Used by GET /api/certificates/[code]/pdf
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#c7d2fe',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerOrg: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 24,
  },
  label: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  pathLabel: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  pathTitle: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    padding: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verification: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 24,
    fontSize: 9,
    color: '#64748b',
  },
  verificationCode: {
    fontFamily: 'Courier',
    marginTop: 4,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    fontSize: 9,
    color: '#64748b',
  },
})

export interface CertificatePDFProps {
  recipientName: string
  pathTitle: string
  orgName: string
  issuedDate: string
  courseCount: number
  verificationCode: string
  certificateUrl: string
}

export function CertificatePDF({
  recipientName,
  pathTitle,
  orgName,
  issuedDate,
  courseCount,
  verificationCode,
  certificateUrl,
}: CertificatePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Certificate of Completion</Text>
            <Text style={styles.headerOrg}>{orgName}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>This certifies that</Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <Text style={styles.pathLabel}>has successfully completed the learning path</Text>
          <View style={styles.pathTitle}>
            <Text>{pathTitle}</Text>
          </View>
          <Text style={styles.label}>
            {courseCount > 0 ? `${courseCount} courses completed` : 'Full path'} · Issued {issuedDate}
          </Text>
        </View>
        <View style={styles.verification}>
          <Text>Verified credential</Text>
          <Text>Verification code: {verificationCode}</Text>
          <Text style={styles.verificationCode}>{certificateUrl}</Text>
        </View>
        <View style={styles.footer}>
          <Text>Powered by Sudar — Learns with you, for you.</Text>
        </View>
      </Page>
    </Document>
  )
}
