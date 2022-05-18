const request = require('supertest')("https://qa.staging.saleor.cloud/graphql/");
const requestR = require('supertest')("https://master.staging.saleor.cloud/graphql/");


describe('Basic Checkout', () => {

  it('should complete basic checkout', async () => {
    let checkout;

    const response = request.post("")
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
      .expect(200)
      .end((err, res) => {
        if (err) return document(err)
        checkout = res.body.data.checkoutCreate.checkout;
      })
  });
})