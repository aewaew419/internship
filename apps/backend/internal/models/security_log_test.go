package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSecurityLogModel(t *testing.T) {
	t.Run("SecurityLog TableName", func(t *testing.T) {
		log := SecurityLog{}
		assert.Equal(t, "security_logs", log.TableName())
	})

	t.Run("SecurityAction Constants", func(t *testing.T) {
		assert.Equal(t, SecurityAction("login"), SecurityActionLogin)
		assert.Equal(t, SecurityAction("logout"), SecurityActionLogout)
		assert.Equal(t, SecurityAction("failed_login"), SecurityActionFailedLogin)
		assert.Equal(t, SecurityAction("password_change"), SecurityActionPasswordChange)
		assert.Equal(t, SecurityAction("token_refresh"), SecurityActionTokenRefresh)
		assert.Equal(t, SecurityAction("token_revoke"), SecurityActionTokenRevoke)
		assert.Equal(t, SecurityAction("account_locked"), SecurityActionAccountLocked)
		assert.Equal(t, SecurityAction("suspicious_activity"), SecurityActionSuspiciousActivity)
	})

	t.Run("SecurityLog Struct Fields", func(t *testing.T) {
		userAgent := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
		log := SecurityLog{
			ID:        1,
			UserType:  "User",
			UserID:    "12345678",
			Action:    SecurityActionLogin,
			IPAddress: "192.168.1.1",
			UserAgent: &userAgent,
			Metadata:  `{"device_type": "web", "browser": "Chrome"}`,
		}

		assert.Equal(t, uint(1), log.ID)
		assert.Equal(t, "User", log.UserType)
		assert.Equal(t, "12345678", log.UserID)
		assert.Equal(t, SecurityActionLogin, log.Action)
		assert.Equal(t, "192.168.1.1", log.IPAddress)
		assert.Equal(t, userAgent, *log.UserAgent)
		assert.Equal(t, `{"device_type": "web", "browser": "Chrome"}`, log.Metadata)
	})

	t.Run("SecurityLogMetadata Structure", func(t *testing.T) {
		metadata := SecurityLogMetadata{
			DeviceType:    "web",
			Browser:       "Chrome",
			OS:            "macOS",
			Location:      "Bangkok, Thailand",
			FailureReason: "invalid_password",
			TokenID:       123,
			SessionID:     "session_abc123",
		}

		assert.Equal(t, "web", metadata.DeviceType)
		assert.Equal(t, "Chrome", metadata.Browser)
		assert.Equal(t, "macOS", metadata.OS)
		assert.Equal(t, "Bangkok, Thailand", metadata.Location)
		assert.Equal(t, "invalid_password", metadata.FailureReason)
		assert.Equal(t, uint(123), metadata.TokenID)
		assert.Equal(t, "session_abc123", metadata.SessionID)
	})

	t.Run("Polymorphic User Relationships", func(t *testing.T) {
		// Test User security log
		userLog := SecurityLog{
			UserType: "User",
			UserID:   "12345678",
			Action:   SecurityActionLogin,
		}
		assert.Equal(t, "User", userLog.UserType)
		assert.Equal(t, "12345678", userLog.UserID)

		// Test SuperAdmin security log
		adminLog := SecurityLog{
			UserType: "SuperAdmin",
			UserID:   "1",
			Action:   SecurityActionLogin,
		}
		assert.Equal(t, "SuperAdmin", adminLog.UserType)
		assert.Equal(t, "1", adminLog.UserID)
	})
}