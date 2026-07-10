/**
 * plannerValidator.js
 * 
 * Validates planner output using existing schema.
 * Adds additional business logic validation.
 * 
 * Responsibilities:
 * - Validate schema using existing plannerSchema
 * - Validate required fields
 * - Validate confidence/quality
 * - Return structured validation result
 */

const { validatePlannerResponse } = require('../agent/plannerSchema');

class PlannerValidator {
  /**
   * Validate planner response
   * 
   * @param {Object} plannerResponse - Response from planner
   * @returns {Object} Validation result
   */
  validate(plannerResponse) {
    const errors = [];

    // Step 1: Schema validation using existing validator
    const schemaValidation = validatePlannerResponse(plannerResponse);
    
    if (!schemaValidation.success) {
      return {
        success: false,
        data: null,
        errors: [{
          type: 'schema',
          message: 'Schema validation failed',
          details: schemaValidation.error.details
        }]
      };
    }

    const response = schemaValidation.data;

    // Step 2: Validate reasoning quality
    if (!response.reasoning || response.reasoning.length < 20) {
      errors.push({
        type: 'quality',
        field: 'reasoning',
        message: 'Reasoning is too short or missing'
      });
    }

    // Step 3: Validate decision structure
    if (!response.decision || !response.decision.type) {
      errors.push({
        type: 'required',
        field: 'decision',
        message: 'Decision is missing or incomplete'
      });
    }

    // Step 4: Validate tool calls structure
    if (!Array.isArray(response.toolCalls)) {
      errors.push({
        type: 'structure',
        field: 'toolCalls',
        message: 'Tool calls must be an array'
      });
    } else {
      // Validate each tool call
      response.toolCalls.forEach((tc, index) => {
        if (!tc.tool || !tc.action) {
          errors.push({
            type: 'structure',
            field: `toolCalls[${index}]`,
            message: 'Tool call missing tool or action'
          });
        }
      });
    }

    // Step 5: Validate response message
    if (!response.responseMessage || response.responseMessage.length === 0) {
      errors.push({
        type: 'required',
        field: 'responseMessage',
        message: 'Response message is empty'
      });
    }

    // Step 6: Calculate confidence score
    const confidenceScore = this.calculateConfidence(response);

    if (errors.length > 0) {
      return {
        success: false,
        data: response,
        errors,
        confidenceScore
      };
    }

    return {
      success: true,
      data: response,
      errors: [],
      confidenceScore
    };
  }

  /**
   * Calculate confidence score based on response quality
   * @private
   */
  calculateConfidence(response) {
    let score = 0;

    // Reasoning quality (40 points)
    if (response.reasoning) {
      if (response.reasoning.length > 100) score += 40;
      else if (response.reasoning.length > 50) score += 30;
      else if (response.reasoning.length > 20) score += 20;
    }

    // Decision present (20 points)
    if (response.decision && response.decision.type) {
      score += 20;
    }

    // Tool calls quality (20 points)
    if (Array.isArray(response.toolCalls)) {
      if (response.toolCalls.length > 0) score += 20;
      else score += 10; // Valid but empty
    }

    // Response message quality (20 points)
    if (response.responseMessage) {
      if (response.responseMessage.length > 50) score += 20;
      else if (response.responseMessage.length > 10) score += 10;
    }

    return Math.min(score, 100);
  }
}

// Export singleton
module.exports = new PlannerValidator();
