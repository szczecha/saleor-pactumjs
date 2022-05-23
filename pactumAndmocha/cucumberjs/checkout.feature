Feature: Checkout test

  Scenario: Simple checkout test
    Given user is creating checkout with default address and sample product
    Then response should contain available shipping methods
    When he is assigning shipping method
    Then response should have status code 200
    And correct total price
    When he is creating dummy payment
    Then response should have status code 200
    When he completes checkout
    Then response should have status code 200
    And fully charged payment status
