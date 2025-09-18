import { test } from '@japa/runner'

test.group('Student Evaluate Companies - Complete Workflow Integration', (group) => {
  test('complete evaluation workflow - check status, submit, verify status', async ({ client, assert }) => {
    // Test data
    const studentTrainingId = 1
    const mockEvaluationData = {
      ids: [1, 2],
      scores: [4, 5],
      comment: 'Great company experience'
    }

    // Step 1: Check initial evaluation status (should be false)
    const initialStatusResponse = await client
      .get(`/student/evaluate/company/${studentTrainingId}/status`)
      .header('Authorization', 'Bearer mock-token')

    // Verify initial status response structure
    assert.properties(initialStatusResponse.body(), [
      'hasEvaluated',
      'companyName'
    ])
    
    // If not evaluated initially, proceed with submission
    if (!initialStatusResponse.body().hasEvaluated) {
      // Step 2: Get evaluation form data
      const formDataResponse = await client
        .get(`/student/evaluate/company/${studentTrainingId}`)
        .header('Authorization', 'Bearer mock-token')

      assert.isArray(formDataResponse.body())
      assert.isNotEmpty(formDataResponse.body())

      // Step 3: Submit evaluation
      const submissionResponse = await client
        .put(`/student/evaluate/company/${studentTrainingId}`)
        .header('Authorization', 'Bearer mock-token')
        .json(mockEvaluationData)

      // Verify submission response structure
      assert.properties(submissionResponse.body(), [
        'success',
        'message',
        'redirectUrl'
      ])
      assert.isTrue(submissionResponse.body().success)
      assert.include(submissionResponse.body().redirectUrl, `id=${studentTrainingId}`)

      // Step 4: Check evaluation status after submission (should be true)
      const finalStatusResponse = await client
        .get(`/student/evaluate/company/${studentTrainingId}/status`)
        .header('Authorization', 'Bearer mock-token')

      assert.isTrue(finalStatusResponse.body().hasEvaluated)
      assert.exists(finalStatusResponse.body().evaluationDate)
      assert.exists(finalStatusResponse.body().companyName)
    }
  })

  test('handles invalid company ID workflow', async ({ client, assert }) => {
    const invalidId = 99999

    // Step 1: Try to check status for non-existent company
    const statusResponse = await client
      .get(`/student/evaluate/company/${invalidId}/status`)
      .header('Authorization', 'Bearer mock-token')

    // Should return 404 or appropriate error
    assert.oneOf(statusResponse.status(), [404, 400])

    // Step 2: Try to get form data for non-existent company
    const formResponse = await client
      .get(`/student/evaluate/company/${invalidId}`)
      .header('Authorization', 'Bearer mock-token')

    assert.oneOf(formResponse.status(), [404, 400])

    // Step 3: Try to submit evaluation for non-existent company
    const submissionResponse = await client
      .put(`/student/evaluate/company/${invalidId}`)
      .header('Authorization', 'Bearer mock-token')
      .json({
        ids: [1],
        scores: [4],
        comment: 'Test'
      })

    assert.oneOf(submissionResponse.status(), [404, 400])
  })

  test('handles unauthorized access workflow', async ({ client, assert }) => {
    const studentTrainingId = 1

    // Step 1: Try to access without authentication
    const statusResponse = await client
      .get(`/student/evaluate/company/${studentTrainingId}/status`)

    assert.equal(statusResponse.status(), 401)

    // Step 2: Try to get form data without authentication
    const formResponse = await client
      .get(`/student/evaluate/company/${studentTrainingId}`)

    assert.equal(formResponse.status(), 401)

    // Step 3: Try to submit without authentication
    const submissionResponse = await client
      .put(`/student/evaluate/company/${studentTrainingId}`)
      .json({
        ids: [1],
        scores: [4],
        comment: 'Test'
      })

    assert.equal(submissionResponse.status(), 401)
  })

  test('verifies navigation and redirect behavior', async ({ client, assert }) => {
    const studentTrainingId = 1
    const evaluationData = {
      ids: [1, 2],
      scores: [4, 5],
      comment: 'Navigation test'
    }

    // Submit evaluation
    const submissionResponse = await client
      .put(`/student/evaluate/company/${studentTrainingId}`)
      .header('Authorization', 'Bearer mock-token')
      .json(evaluationData)

    if (submissionResponse.status() === 200 || submissionResponse.status() === 201) {
      const responseBody = submissionResponse.body()
      
      // Verify redirect URL is provided
      assert.exists(responseBody.redirectUrl)
      assert.include(responseBody.redirectUrl, 'company_evaluation/company')
      assert.include(responseBody.redirectUrl, `id=${studentTrainingId}`)
      
      // Verify success message is provided
      assert.exists(responseBody.message)
      assert.isString(responseBody.message)
      
      // Verify success flag
      assert.isTrue(responseBody.success)
    }
  })

  test('verifies error response format consistency', async ({ client, assert }) => {
    const testCases = [
      {
        description: 'Invalid student training ID',
        endpoint: '/student/evaluate/company/invalid/status',
        expectedStatus: [400, 404]
      },
      {
        description: 'Non-existent student training ID',
        endpoint: '/student/evaluate/company/99999/status',
        expectedStatus: [404]
      }
    ]

    for (const testCase of testCases) {
      const response = await client
        .get(testCase.endpoint)
        .header('Authorization', 'Bearer mock-token')

      assert.oneOf(response.status(), testCase.expectedStatus)
      
      if (response.status() >= 400) {
        // Verify error response has consistent structure
        const body = response.body()
        assert.exists(body.message || body.error)
      }
    }
  })
})