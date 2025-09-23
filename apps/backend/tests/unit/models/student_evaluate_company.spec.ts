import { test } from '@japa/runner'
import StudentEvaluateCompany from '#models/student_evaluate_company'

test.group('StudentEvaluateCompany Model', () => {
  test('hasEvaluated method exists and is callable', async ({ assert }) => {
    // Test that the static method exists and is a function
    assert.isFunction(StudentEvaluateCompany.hasEvaluated)
    assert.equal(typeof StudentEvaluateCompany.hasEvaluated, 'function')
  })

  test('getEvaluationWithCompany method exists and is callable', async ({ assert }) => {
    // Test that the static method exists and is a function
    assert.isFunction(StudentEvaluateCompany.getEvaluationWithCompany)
    assert.equal(typeof StudentEvaluateCompany.getEvaluationWithCompany, 'function')
  })

  test('hasEvaluated method signature is correct', async ({ assert }) => {
    // Test that the method accepts a number parameter
    const method = StudentEvaluateCompany.hasEvaluated
    assert.equal(method.length, 1) // Should accept 1 parameter
  })

  test('getEvaluationWithCompany method signature is correct', async ({ assert }) => {
    // Test that the method accepts a number parameter
    const method = StudentEvaluateCompany.getEvaluationWithCompany
    assert.equal(method.length, 1) // Should accept 1 parameter
  })

  test('model static methods are properly defined', async ({ assert }) => {
    // Test that static methods are bound to the class
    assert.equal(StudentEvaluateCompany.hasEvaluated.name, 'hasEvaluated')
    assert.equal(StudentEvaluateCompany.getEvaluationWithCompany.name, 'getEvaluationWithCompany')
    
    // Test that methods are static (not instance methods)
    const evaluation = new StudentEvaluateCompany()
    assert.isUndefined((evaluation as any).hasEvaluated)
    assert.isUndefined((evaluation as any).getEvaluationWithCompany)
  })

  test('model class has correct structure', async ({ assert }) => {
    // Test that the class exists and is a constructor function
    assert.isFunction(StudentEvaluateCompany)
    assert.equal(typeof StudentEvaluateCompany, 'function')
    
    // Test that it can be instantiated
    const evaluation = new StudentEvaluateCompany()
    assert.instanceOf(evaluation, StudentEvaluateCompany)
  })

  test('model has table configuration', async ({ assert }) => {
    // Test that the model has a table property (inherited from BaseModel)
    assert.property(StudentEvaluateCompany, 'table')
    assert.equal(typeof StudentEvaluateCompany.table, 'string')
  })
})