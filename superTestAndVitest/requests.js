
const request = require('supertest')("https://qa.staging.saleor.cloud/graphql/");

function createCheckoutRequest({ channel, lines, email, shippingAddress, billingAddress }) {
  return request.post("")
    .send({
      query: `mutation CreateCheckout($checkoutInput: CheckoutCreateInput!) {
      checkoutCreate(input: $checkoutInput) {
      errors: checkoutErrors {
          code
          field
          message
      }
      checkout {
          token
          id
          token
          shippingMethods {
          name
          id
          }
          lines {
          variant {
              id
              pricing {
              onSale
              price {
                  gross {
                  amount
                  }
              }
              }
          }
          }
      }
      }
  }`,
      variables: {
        "checkoutInput": {
          channel,
          email,
          lines,
          shippingAddress,
          billingAddress
        }
      }
    })
    .timeout(10000)
    .expect(200);
}

function updateCheckoutShippingMethodRequest({ checkoutId, shippingMethodId }) {
  return request.post("")
    .send({
      query: `mutation UpdateCheckoutShippingMethod(
              $checkoutId: ID!
              $shippingMethodId: ID!
          ) {
              checkoutShippingMethodUpdate(
              checkoutId: $checkoutId
              shippingMethodId: $shippingMethodId
              ) {
                  errors: checkoutErrors {
                      code
                      field
                      message
                  }
              checkout {
                  id
                  shippingMethod {
                  id
                  name
                  }
                  totalPrice {
                  gross {
                      amount
                  }
                  }
              }
              }
          }`,
      variables: {
        "checkoutId": checkoutId,
        "shippingMethodId": shippingMethodId
      }
    })
    .timeout(10000)
    .expect(200)
}

function paymentRequest({checkoutId, totalGross, gateway="mirumee.payments.dummy", token="charged"}){
  return request.post("")
      .send({
        query: `mutation createPayment($paymentInput: PaymentInput!, $checkoutId: ID!) {
          checkoutPaymentCreate(input: $paymentInput, checkoutId: $checkoutId) {
          errors {
              field
              message
          }
          }
      }
      `,
        variables: {
          "checkoutId": checkoutId,
          "paymentInput": {
            "amount": totalGross,
            gateway,
            "returnUrl": "https://localhost:3001/checkout/payment-confirm",
            token
          }
        }
      })
      .timeout(1000000)
      .expect(200);
}

function completeCheckout({checkoutId}){
  return request.post("")
      .send({
        query: `mutation completeCheckout($checkoutId: ID!) {
          checkoutComplete(checkoutId: $checkoutId) {
          errors {
              field
              message
          }
          order {
              id
              token
              paymentStatus
          }
          }
      }
      `,
        variables: {
          checkoutId
        }
      })
      .timeout(100000)
      .expect(200)
}

module.exports = {createCheckoutRequest, updateCheckoutShippingMethodRequest, paymentRequest, completeCheckout}