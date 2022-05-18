const request = require('supertest')("https://qa.staging.saleor.cloud/graphql/");
const requestR = require('supertest')("https://master.staging.saleor.cloud/graphql/");


describe('Basic Checkout', () => {

  it('should complete basic checkout', async () => {
    jest.setTimeout(10000)

    const checkoutResp = await request.post("")
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
            "channel": "default-channel",
            "email": "b@v.pl",
            "lines": [
              {
                "quantity": 5,
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
      })
      .expect((res) => {
        expect(res.body.data.checkoutCreate.errors).toHaveLength(0);
      })
      .expect(200)

    const checkout = checkoutResp.body.data.checkoutCreate.checkout;

    const updateCheckoutShippingMethodResp = await request.post("")
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
          "checkoutId": checkout.id,
          "shippingMethodId": checkout.shippingMethods[0].id
        }
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.checkoutShippingMethodUpdate.errors).toHaveLength(0);
      })

      const totalGross = updateCheckoutShippingMethodResp.body.data.checkoutShippingMethodUpdate.checkout.totalPrice.gross.amount;

    const payment = await request.post("")
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
          "checkoutId": checkout.id,
          "paymentInput": {
            "amount": totalGross,
            "gateway": "mirumee.payments.dummy",
            "returnUrl": "https://localhost:3001/checkout/payment-confirm",
            "token": "charged"
          }
        }
      })
      .expect(200);

      await request.post("")
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
        "checkoutId": checkout.id
        }
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.checkoutComplete.order.paymentStatus).toEqual("FULLY_CHARGED")
      })
  })
})