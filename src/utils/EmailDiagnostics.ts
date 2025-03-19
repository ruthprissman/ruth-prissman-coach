
/**
 * Helper class for email content diagnostics
 */
export class EmailDiagnostics {
  /**
   * Diagnose email content for potential issues
   * @param emailHtml The full HTML content to be diagnosed
   * @param recipientEmail The target email (will be masked in logs for privacy)
   * @param articleId The ID of the article being published
   * @returns Object containing diagnosis results and the original HTML
   */
  public diagnoseEmailContent(emailHtml: string, recipientEmail: string, articleId: number): {
    html: string,
    isValid: boolean,
    issues: string[]
  } {
    const issues: string[] = [];
    let isValid = true;
    
    // 1. Log the full content length
    const contentLength = emailHtml.length;
    console.log('[Email Diagnostics] Article #' + articleId + ' - Email content length: ' + contentLength + ' characters');
    
    // 2. Check for content size issues
    if (contentLength > 50000) {
      const warning = '[Email Diagnostics] ⚠️ WARNING: Email content exceeds 50,000 characters (' + contentLength + '). May be truncated by email providers.';
      console.warn(warning);
      issues.push(warning);
    }
    
    // 3. Check for empty or too short content
    if (contentLength < 100) {
      const error = '[Email Diagnostics] ❌ ERROR: Email content suspiciously short (' + contentLength + ' chars). Possible truncation or generation failure.';
      console.error(error);
      issues.push(error);
      isValid = false;
    }
    
    // 4. Check for proper HTML structure
    if (!emailHtml.includes('<!DOCTYPE html>') && !emailHtml.includes('<html')) {
      const warning = '[Email Diagnostics] ⚠️ WARNING: Email HTML may not have proper DOCTYPE or <html> tag.';
      console.warn(warning);
      issues.push(warning);
    }
    
    // 5. Check for RTL support and Hebrew character encoding
    if (!emailHtml.includes('dir="rtl"') && !emailHtml.includes('direction: rtl')) {
      const warning = '[Email Diagnostics] ⚠️ WARNING: Email HTML may not have RTL direction specified.';
      console.warn(warning);
      issues.push(warning);
    }
    
    // 6. Check for Hebrew characters
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(emailHtml)) {
      const warning = '[Email Diagnostics] ⚠️ WARNING: Email may not contain Hebrew characters. Possible encoding issue.';
      console.warn(warning);
      issues.push(warning);
    }
    
    // 7. Verify closing tags balance (basic check)
    const openingBodyTags = (emailHtml.match(/<body/g) || []).length;
    const closingBodyTags = (emailHtml.match(/<\/body>/g) || []).length;
    
    if (openingBodyTags !== closingBodyTags) {
      const error = '[Email Diagnostics] ❌ ERROR: Unbalanced <body> tags (' + openingBodyTags + ' opening, ' + closingBodyTags + ' closing).';
      console.error(error);
      issues.push(error);
      isValid = false;
    }
    
    // 8. Log masked version of the content for debugging (first 500 chars)
    // Replace any potential sensitive data like emails with masked versions
    const maskedEmail = recipientEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    
    console.log('[Email Diagnostics] Article #' + articleId + ' - Sending to: ' + maskedEmail);
    console.log('[Email Diagnostics] Article #' + articleId + ' - Email content preview (first 500 chars):');
    
    // Safe logging of HTML preview without template literals
    const previewContent = emailHtml.substring(0, 500) + (emailHtml.length > 500 ? '...' : '');
    console.log(previewContent);
    
    // Return diagnosis results and the ORIGINAL HTML (unmodified)
    return {
      html: emailHtml, // Return the original HTML unchanged
      isValid,
      issues
    };
  }

  /**
   * Log email content hash for integrity verification
   * @param emailHtml The HTML content
   * @param stage The processing stage (e.g., 'before-api', 'after-transform')
   * @param articleId The article ID
   */
  public logContentIntegrityHash(emailHtml: string, stage: string, articleId: number): string {
    // Simple hash function for content verification
    // This is not for security, just for integrity checking
    let hash = 0;
    if (emailHtml.length === 0) return '0';
    
    for (let i = 0; i < emailHtml.length; i++) {
      const char = emailHtml.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const hashStr = hash.toString(16);
    console.log('[Email Integrity] Article #' + articleId + ' - ' + stage + ' content hash: ' + hashStr + ' (length: ' + emailHtml.length + ')');
    return hashStr;
  }
}
