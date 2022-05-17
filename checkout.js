const { spec, request } = require('pactum');
const { like } = require('pactum-matchers');

request.setBaseUrl('http://localhost:8000/graphql');

describe('Basic Checkout', () => {

    it('should create checkout', async () => {
    await spec()
    .post('/')
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
    )
    .expectStatus(200)
    .stores('checkoutToken', 'data.checkoutCreate.checkout.token')
    .stores('checkoutId', 'data.checkoutCreate.checkout.id')
    .stores('shippingMethod', 'data.checkoutCreate.checkout.shippingMethods[0].id');
    });

    it('should assign shipping method', async () => {
    await spec()
    .post('/')
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
    .expectStatus(200)
    .stores('totalGross', 'data.checkoutShippingMethodUpdate.checkout.totalPrice.gross.amount');
    });

    it('should create payment', async () => {
    await spec()
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
    .expectStatus(200)
    });

    it('should complete checkout', async () => {
    await spec()
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
    .expectStatus(200)
    .expectJsonMatch('data.checkoutComplete.order.paymentStatus', like('FULLY_CHARGED'));

    });

});
