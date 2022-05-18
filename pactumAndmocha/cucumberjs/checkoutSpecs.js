
const pactum = require('pactum');
var chai = require('chai'); 
var expect = chai.expect;
const { like } = require('pactum-matchers');
const { Given, When, Then, Before } = require('@cucumber/cucumber');

pactum.request.setBaseUrl('https://qa.staging.saleor.cloud/graphql');

let spec = pactum.spec();

Before(() => {
  spec = pactum.spec();
});

Given('user is creating checkout with default address and sample product', async () => {
  spec
    .post("/")
    .withGraphQLQuery(`mutation CreateCheckout($checkoutInput: CheckoutCreateInput!) {
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
    }
    `)
    .withGraphQLVariables(
      //check if email input can be stored in some fixture file
      {
        "checkoutInput": {
          "channel": "default-channel",
          "email": "b@v.pl",
          "lines": [
            {
              "quantity": 5000,
              "variantId": "UHJvZHVjdFZhcmlhbnQ6MjQ4"
            }
          ],
          "shippingAddress": {
            "city": "Wrocław",
            "companyName": "",
            "country": "PL",
            "countryArea": "dolnośląskie",
            "firstName": "Anna",
            "lastName": "Custommer",
            "postalCode": "53-601",
            "streetAddress1": "Tęczowa 7",
            "streetAddress2": ""
          },
          "billingAddress": {
            "city": "Wrocław",
            "companyName": "",
            "country": "PL",
            "countryArea": "dolnośląskie",
            "firstName": "Anna",
            "lastName": "Custommer",
            "postalCode": "53-601",
            "streetAddress1": "Tęczowa 7",
            "streetAddress2": ""
          }
        }
      }
    )
});

Then('response should contain available shipping methods', async () => {
  await spec
    .toss();
  spec
    .expectStatus(200)
    .stores('checkoutToken', 'data.checkoutCreate.checkout.token')
    .stores('checkoutId', 'data.checkoutCreate.checkout.id')
    .stores('shippingMethod', 'data.checkoutCreate.checkout.shippingMethods[0].id');

})

When('he is assigning shipping method', () => {
  spec = pactum.spec();
  spec["post"]('/')
    .withGraphQLQuery(`mutation UpdateCheckoutShippingMethod(
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
  }
  `)
    .withGraphQLVariables(
      {
        "checkoutId": "$S{checkoutId}",
        "shippingMethodId": "$S{shippingMethod}"
      }
    )
})

Then('response should have status code 200', async () => {
  await spec.toss();
  spec.expectStatus(200);
})

Then('correct total price', () => {
  spec.stores('totalGross', 'data.checkoutShippingMethodUpdate.checkout.totalPrice.gross.amount');
})

When('he is creating dummy payment', () => {
  spec = pactum.spec()
  spec
    .post('/')
    .withGraphQLQuery(`mutation createPayment($paymentInput: PaymentInput!, $checkoutId: ID!) {
      checkoutPaymentCreate(input: $paymentInput, checkoutId: $checkoutId) {
      errors {
          field
          message
      }
      }
  }
  `)
    .withGraphQLVariables(
      {
        "checkoutId": "$S{checkoutId}",
        "paymentInput": {
          "amount": "$S{totalGross}",
          "gateway": "mirumee.payments.dummy",
          "returnUrl": "https://localhost:3001/checkout/payment-confirm",
          "token": "charged"
        }
      }
    )
})

When('he completes checkout', () => {
  spec = pactum.spec();
  spec
    .post('/')
    .withGraphQLQuery(`mutation completeCheckout($checkoutId: ID!) {
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
  `)
    .withGraphQLVariables(
      {
        "checkoutId": "$S{checkoutId}"
      }
    )
})

Then('fully charged payment status', async () => {
  const resp = await spec.toss();
  const respObj = JSON.parse(resp.text);
  expect(respObj.data.checkoutComplete.order.paymentStatus).to.equal("FULLY_CHARGED")
})