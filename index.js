const AWSXRay = require('aws-xray-sdk-core');

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment() || {
    addNewSubsegment: () => ({ close: () => {}, addError: () => {} })
  };
  const subsegment = segment.addNewSubsegment('LogicaDeSuma');

  console.log("📥 EVENT:", JSON.stringify(event));

  try {
    // Health check desde ALB
    if (event.httpMethod === 'GET' && event.path === '/') {
      subsegment.close();
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'healthy' }),
      };
    }

    // Entrada esperada: { "num1": 10, "num2": 5 }
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const num1 = parseFloat(body?.num1);
    const num2 = parseFloat(body?.num2);

    if (isNaN(num1) || isNaN(num2)) {
      throw new Error("Inputs must be numbers");
    }

    const result = num1 + num2;
    subsegment.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    subsegment.addError(err);
    subsegment.close();
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
