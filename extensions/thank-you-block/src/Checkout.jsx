
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default () => {
  render(<Extension />, document.body);
};
function Extension() {

  const [epay, setEpay] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const orderConfirmation =
    shopify.orderConfirmation?.current;

  const orderId =
    orderConfirmation?.order?.id
      ?.split("/")
      ?.pop();

  console.log(
    "ORDER ID:",
    orderId
  );

useEffect(() => {

  if (!orderId) {
    return;
  }

  const timer = setTimeout(async () => {

    try {

      console.log(
        "📦 Fetching ePay:",
        orderId
      );

      const response =
        await fetch(
          `https://epay-shopify-app-v1.vercel.app/api/get-order-epay?orderId=${orderId}`
        );

      if (!response.ok) {

        throw new Error(
          "API request failed"
        );
      }

      const json =
        await response.json();

      console.log(
        "✅ ePay Data:",
        json
      );

      if (!json) {

        setError(
          "Payment data not found"
        );

        setLoading(false);

        return;
      }

      setEpay(json);

      setLoading(false);

    } catch (err) {

      console.log(err);

      setError(
        "Failed to load payment info"
      );
      setLoading(false);
    }

  }, 9000);

  return () => clearTimeout(timer);

}, [orderId]);



  /*
  |--------------------------------------------------------------------------
  | UI STATES
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (
      <s-text>
        Preparing Pin information...
      </s-text>
    );
  }

  if (error) {

    return (
      <s-text>
        {error}
      </s-text>
    );
  }

  if (!epay) {

    return (
      <s-text>
        No payment data found
      </s-text>
    );
  }

  const { RESPONSE } = epay;

  console.log(
    "🟢 ePay RESPONSE:",
    RESPONSE, epay
  );
  if (
    RESPONSE?.RESULTTEXT !==
      "transaction successful" &&
    RESPONSE?.RESULT !== 0
  ) {

    return (
      <s-text>
        {RESPONSE?.RESULTTEXT}
      </s-text>
    );
  }

  

  return (

    <s-stack
      gap="base"
      borderWidth="base"
      borderRadius="small"
      padding="small"
    >

      <s-text>
        Order Status:
        {" "}
        Success
      </s-text>

      <s-text>
        Serial Number:
        {" "}
        {RESPONSE?.PINCREDENTIALS?.SERIAL}
      </s-text>

      <s-text>
        Expiry:
        {" "}
        {RESPONSE?.PINCREDENTIALS?.VALIDTO}
      </s-text>

      <s-text>
        Transaction Date:
        {" "}
        {RESPONSE?.LOCALDATETIME}
      </s-text>

      <s-text>
        Pin:
        {" "}
        {RESPONSE?.PINCREDENTIALS?.PIN}
      </s-text>

    </s-stack>
  );
}