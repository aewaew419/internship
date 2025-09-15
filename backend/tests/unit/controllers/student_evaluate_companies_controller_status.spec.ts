import { test } from '@japa/runner'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import StudentEvaluateCompaniesController from '#controllers/student_evaluate_companies_controller'
import StudentEvaluateCompany from '#models/student_evaluate_company'
import StudentTraining from '#models/student_training'
import { DateTime } from 'luxon'

test.group('StudentEvaluateCompaniesController - Status Functionality', (group) => {
  let controller: StudentEvaluateCompaniesController

  group.setup(() => {
    controller = new StudentEvaluateCompaniesController()
  })

  test('checkEvaluationStatus returns unauthorized when user not authenticated', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: '1' },
        auth: { user: null }
      })
      .create()

    const mockResponse = {
      unauthorized: (data: any) => data
    }
    ctx.response = mockResponse as any

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: false,
      message: 'Authentication required'
    })
  })

  test('checkEvaluationStatus returns bad request for invalid studentTrainingId', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: 'invalid' },
        auth: { user: { id: 1 } }
      })
      .create()

    const mockResponse = {
      badRequest: (data: any) => data
    }
    ctx.response = mockResponse as any

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: false,
      message: 'Valid student training ID is required'
    })
  })

  test('checkEvaluationStatus returns not found when student training does not exist', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: '999' },
        auth: { user: { id: 1 } }
      })
      .create()

    const mockResponse = {
      notFound: (data: any) => data
    }
    ctx.response = mockResponse as any

    // Mock StudentTraining.query to return null
    const originalQuery = StudentTraining.query
    StudentTraining.query = () => ({
      where: () => ({
        preload: () => ({
          preload: () => ({
            first: async () => null
          })
        })
      })
    }) as any

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: false,
      message: 'Student training not found'
    })

    // Restore original method
    StudentTraining.query = originalQuery
  })

  test('checkEvaluationStatus returns forbidden when user tries to access other student data', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: '1' },
        auth: { user: { id: 2 } } // Different user ID
      })
      .create()

    const mockResponse = {
      forbidden: (data: any) => data
    }
    ctx.response = mockResponse as any

    // Mock StudentTraining.query to return training with different user
    const originalQuery = StudentTraining.query
    StudentTraining.query = () => ({
      where: () => ({
        preload: () => ({
          preload: () => ({
            first: async () => ({
              company: { 
                company_name_th: 'Test Company',
                company_name_en: 'Test Company EN',
                id: 1
              },
              student_enroll: {
                student: { user_id: 1 } // Different from authenticated user (id: 2)
              }
            })
          })
        })
      })
    }) as any

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: false,
      message: 'Access denied: You can only check your own evaluation status'
    })

    // Restore original method
    StudentTraining.query = originalQuery
  })

  test('checkEvaluationStatus returns success with hasEvaluated false when no evaluation exists', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: '1' },
        auth: { user: { id: 1 } }
      })
      .create()

    const mockResponse = {
      ok: (data: any) => data
    }
    ctx.response = mockResponse as any

    // Mock StudentTraining.query to return valid training
    const originalTrainingQuery = StudentTraining.query
    StudentTraining.query = () => ({
      where: () => ({
        preload: () => ({
          preload: () => ({
            first: async () => ({
              company: { 
                company_name_th: 'Test Company',
                company_name_en: null,
                id: 1
              },
              student_enroll: {
                student: { user_id: 1 }
              }
            })
          })
        })
      })
    }) as any

    // Mock StudentEvaluateCompany.hasEvaluated to return false
    const originalHasEvaluated = StudentEvaluateCompany.hasEvaluated
    StudentEvaluateCompany.hasEvaluated = async () => false

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: true,
      hasEvaluated: false,
      evaluationDate: null,
      companyName: 'Test Company',
      companyId: 1
    })

    // Restore original methods
    StudentTraining.query = originalTrainingQuery
    StudentEvaluateCompany.hasEvaluated = originalHasEvaluated
  })

  test('checkEvaluationStatus returns success with hasEvaluated true and evaluation date', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: '1' },
        auth: { user: { id: 1 } }
      })
      .create()

    const mockResponse = {
      ok: (data: any) => data
    }
    ctx.response = mockResponse as any

    const mockDate = DateTime.fromISO('2024-01-15T10:30:00Z')

    // Mock StudentTraining.query to return valid training
    const originalTrainingQuery = StudentTraining.query
    StudentTraining.query = () => ({
      where: () => ({
        preload: () => ({
          preload: () => ({
            first: async () => ({
              company: { 
                company_name_th: null,
                company_name_en: 'Test Company EN',
                id: 1
              },
              student_enroll: {
                student: { user_id: 1 }
              }
            })
          })
        })
      })
    }) as any

    // Mock StudentEvaluateCompany.hasEvaluated to return true
    const originalHasEvaluated = StudentEvaluateCompany.hasEvaluated
    StudentEvaluateCompany.hasEvaluated = async () => true

    // Mock StudentEvaluateCompany.query to return evaluation with date
    const originalEvaluationQuery = StudentEvaluateCompany.query
    StudentEvaluateCompany.query = () => ({
      where: () => ({
        first: async () => ({
          createdAt: mockDate
        })
      })
    }) as any

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: true,
      hasEvaluated: true,
      evaluationDate: mockDate.toISO(),
      companyName: 'Test Company EN',
      companyId: 1
    })

    // Restore original methods
    StudentTraining.query = originalTrainingQuery
    StudentEvaluateCompany.hasEvaluated = originalHasEvaluated
    StudentEvaluateCompany.query = originalEvaluationQuery
  })

  test('checkEvaluationStatus handles internal server error', async ({ assert }) => {
    const ctx = new HttpContextFactory()
      .merge({
        params: { studentTrainingId: '1' },
        auth: { user: { id: 1 } }
      })
      .create()

    const mockResponse = {
      internalServerError: (data: any) => data
    }
    ctx.response = mockResponse as any

    // Mock StudentTraining.query to throw error
    const originalQuery = StudentTraining.query
    StudentTraining.query = () => {
      throw new Error('Database connection failed')
    }

    const result = await controller.checkEvaluationStatus(ctx)

    assert.deepEqual(result, {
      success: false,
      message: 'An error occurred while checking evaluation status',
      error: undefined // Should be undefined in non-development environment
    })

    // Restore original method
    StudentTraining.query = originalQuery
  })
})