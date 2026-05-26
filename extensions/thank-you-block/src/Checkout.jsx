
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


useEffect(() => {

  if (!orderId) {
    return;
  }



  console.log(
    "ORDER ID:",
    orderId
  );

 

  const timer =
    setTimeout(async () => {

      try {

        const response =
          await fetch(
                `https://epay-remix-app.fly.dev/api/get-order-epay?orderId=${orderId}`
              )

              console.log(
  "API STATUS:",
  response,
  response.status
);


      

        if (!response.ok) {

          throw new Error(
            `API failed: ${response.status}`
          );
        }

        const json =
          await response.json();



       if (
  !json ||
  !json.RESPONSE
) {

  console.log(
    "INVALID EPAY RESPONSE:",
    json
  );

  setError(
    "Payment data not found"
  );

  setLoading(false);

  return;
}

        setEpay(json);

        setLoading(false);

      } catch (err) {

        console.error(
          "EPAY LOAD ERROR:",
          err
        );

        setError(
          "Failed to load payment info"
        );

        setLoading(false);
      }

    }, 9000);

  return () =>
    clearTimeout(timer);

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

const RESPONSE =
  epay?.RESPONSE;



if (!RESPONSE) {
  return (
    <s-text>
      Waiting for ePay response...
    </s-text>
  );
}

if (Number(RESPONSE?.RESULT) !== 0) {
  return (
    <s-text>
      {RESPONSE?.RESULTTEXT ||
        "ePay transaction failed"}
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