import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import StudentEnrollStatus, { type InternshipApprovalStatus, type CommitteeVote } from '#models/student_enroll_status'

test.group('StudentEnrollStatus Model - Internship Approval Extensions', () => {
  
  test('model has correct status type definition', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    // Test that status can be set to new values
    status.status = 'registered'
    assert.equal(status.status, 'registered')
    
    status.status = 't.approved'
    assert.equal(status.status, 't.approved')
    
    status.status = 'c.approved'
    assert.equal(status.status, 'c.approved')
  })

  test('canTransitionTo validates status transitions correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    // Test valid transitions from registered
    status.status = 'registered'
    assert.isTrue(status.canTransitionTo('t.approved'))
    assert.isTrue(status.canTransitionTo('denied'))
    assert.isFalse(status.canTransitionTo('c.approved'))
    
    // Test valid transitions from t.approved
    status.status = 't.approved'
    assert.isTrue(status.canTransitionTo('c.approved'))
    assert.isTrue(status.canTransitionTo('denied'))
    assert.isFalse(status.canTransitionTo('registered'))
    
    // Test valid transitions from c.approved
    status.status = 'c.approved'
    assert.isTrue(status.canTransitionTo('doc.approved'))
    assert.isTrue(status.canTransitionTo('doc.cancel'))
    assert.isFalse(status.canTransitionTo('t.approved'))
  })

  test('transitionTo method works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.status = 'registered'
    status.status_history = []
    
    // Mock save method to avoid database operations
    status.save = async () => status
    
    // Test valid transition
    const result = await status.transitionTo('t.approved', 1, 'Advisor approved')
    assert.isTrue(result)
    assert.equal(status.status, 't.approved')
    assert.equal(status.status_history.length, 1)
    assert.equal(status.status_history[0].fromStatus, 'registered')
    assert.equal(status.status_history[0].toStatus, 't.approved')
    assert.equal(status.status_history[0].changedBy, 1)
    assert.equal(status.status_history[0].reason, 'Advisor approved')
    
    // Test invalid transition
    const invalidResult = await status.transitionTo('registered', 1)
    assert.isFalse(invalidResult)
    assert.equal(status.status, 't.approved') // Status should not change
  })

  test('committee voting methods work correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = []
    status.committee_vote_count = 0
    status.required_committee_votes = 3
    status.committee_voting_deadline = DateTime.now().plus({ days: 7 })
    
    // Mock save method
    status.save = async () => status
    
    // Test adding committee vote
    const voteResult = await status.addCommitteeVote(1, 'approve', 'Good application')
    assert.isTrue(voteResult)
    assert.equal(status.committee_votes.length, 1)
    assert.equal(status.committee_vote_count, 1)
    assert.equal(status.committee_votes[0].instructorId, 1)
    assert.equal(status.committee_votes[0].vote, 'approve')
    assert.equal(status.committee_votes[0].remarks, 'Good application')
    
    // Test duplicate vote prevention
    const duplicateResult = await status.addCommitteeVote(1, 'reject')
    assert.isFalse(duplicateResult)
    assert.equal(status.committee_votes.length, 1) // Should not increase
    
    // Test voting completion check
    assert.isFalse(status.isCommitteeVotingComplete())
    
    // Add more votes
    await status.addCommitteeVote(2, 'approve')
    await status.addCommitteeVote(3, 'reject')
    
    assert.isTrue(status.isCommitteeVotingComplete())
  })

  test('committee voting result calculation works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = [
      { instructorId: 1, vote: 'approve', votedAt: DateTime.now() },
      { instructorId: 2, vote: 'approve', votedAt: DateTime.now() },
      { instructorId: 3, vote: 'reject', votedAt: DateTime.now() }
    ]
    
    const result = status.getCommitteeVotingResult()
    assert.equal(result.approveCount, 2)
    assert.equal(result.rejectCount, 1)
    assert.isTrue(result.approved)
    
    // Test tie scenario
    status.committee_votes.push({ instructorId: 4, vote: 'reject', votedAt: DateTime.now() })
    const tieResult = status.getCommitteeVotingResult()
    assert.equal(tieResult.approveCount, 2)
    assert.equal(tieResult.rejectCount, 2)
    assert.isFalse(tieResult.approved) // Reject wins in tie
  })

  test('hasInstructorVoted method works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = [
      { instructorId: 1, vote: 'approve', votedAt: DateTime.now() },
      { instructorId: 2, vote: 'reject', votedAt: DateTime.now() }
    ]
    
    assert.isTrue(status.hasInstructorVoted(1))
    assert.isTrue(status.hasInstructorVoted(2))
    assert.isFalse(status.hasInstructorVoted(3))
  })

  test('getStatusDisplayName returns correct Thai names', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    status.status = 'registered'
    assert.equal(status.getStatusDisplayName(), 'ลงทะเบียน')
    
    status.status = 't.approved'
    assert.equal(status.getStatusDisplayName(), 'อาจารย์ที่ปรึกษาอนุมัติ')
    
    status.status = 'c.approved'
    assert.equal(status.getStatusDisplayName(), 'คณะกรรมการอนุมัติ')
    
    status.status = 'doc.approved'
    assert.equal(status.getStatusDisplayName(), 'เอกสารอนุมัติ')
  })

  test('requiresCommitteeVoting method works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    status.status = 'registered'
    assert.isFalse(status.requiresCommitteeVoting())
    
    status.status = 't.approved'
    assert.isTrue(status.requiresCommitteeVoting())
    
    status.status = 'c.approved'
    assert.isFalse(status.requiresCommitteeVoting())
  })

  test('committee voting deadline is respected', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = []
    status.committee_voting_deadline = DateTime.now().minus({ days: 1 }) // Past deadline
    
    // Mock save method
    status.save = async () => status
    
    // Should not allow voting after deadline
    const result = await status.addCommitteeVote(1, 'approve')
    assert.isFalse(result)
    assert.equal(status.committee_votes.length, 0)
  })

  test('status history tracks all transitions', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.status = 'registered'
    status.status_history = []
    
    // Mock save method
    status.save = async () => status
    
    // Make multiple transitions
    await status.transitionTo('t.approved', 1, 'Advisor approved')
    await status.transitionTo('c.approved', 2, 'Committee approved')
    
    assert.equal(status.status_history.length, 2)
    assert.equal(status.status_history[0].fromStatus, 'registered')
    assert.equal(status.status_history[0].toStatus, 't.approved')
    assert.equal(status.status_history[1].fromStatus, 't.approved')
    assert.equal(status.status_history[1].toStatus, 'c.approved')
  })

  test('model class has correct structure', async ({ assert }) => {
    // Test that the class exists and is a constructor function
    assert.isFunction(StudentEnrollStatus)
    assert.equal(typeof StudentEnrollStatus, 'function')
    
    // Test that it can be instantiated
    const status = new StudentEnrollStatus()
    assert.instanceOf(status, StudentEnrollStatus)
  })

  test('model has table configuration', async ({ assert }) => {
    // Test that the model has a table property (inherited from BaseModel)
    assert.property(StudentEnrollStatus, 'table')
    assert.equal(typeof StudentEnrollStatus.table, 'string')
  })
})