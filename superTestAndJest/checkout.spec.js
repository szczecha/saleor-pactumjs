const request = require("./requests");
const { TEST_DATA } = require("./testData")

describe('Basic Checkout', () => {

  it('should complete basic checkout', async () => {
    const checkoutResp = await request.createCheckoutRequest({
      channel: "default-channel",
      email: "b@v.pl",
      lines: [
        {
          "quantity": 5,
          "variantId": "UHJvZHVjdFZhcmlhbnQ6MjQ4"
        }
      ],
      shippingAddress: TEST_DATA.address,
      billingAddress: TEST_DATA.address
    });
    const checkout = checkoutResp.body.data.checkoutCreate.checkout;
    const updateCheckoutShippingMethodResp = await request.updateCheckoutShippingMethodRequest({
      checkoutId: checkout.id, shippingMethodId: checkout.shippingMethods[0].id
    });
    const totalGross = updateCheckoutShippingMethodResp.body.data.checkoutShippingMethodUpdate.checkout.totalPrice.gross.amount;
    await request.paymentRequest({
      checkoutId: checkout.id,
      totalGross
    })
    const completeCheckoutResp = await request.completeCheckout({ checkoutId: checkout.id });
    const checkoutComplete = JSON.parse(completeCheckoutResp.text)
    const paymentStatus = checkoutComplete.data.checkoutComplete.order.paymentStatus;
    expect(paymentStatus).toEqual("FULLY_CHARGED")
  })
})