import prisma from "../db.server";
import { XMLParser } from "fast-xml-parser";

function getTimeStamp() {
  const d = new Date();

  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0")
  );
}

function getDateTimeFormat() {
  const d = new Date();

  return (
    d.toISOString().slice(0, 10) +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0") +
    ":" +
    String(d.getSeconds()).padStart(2, "0")
  );
}

function formatEpayAmount(amount) {
  const value = Number(amount);

  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return Math.round(value * 100).toString();
}

async function callEpaySale(
  amount,
  ean
) {
  const txid =
    `Sale_93889311_${getTimeStamp()}`;

  const xmlPayload = `
<?xml version="1.0" encoding="UTF-8"?>
<REQUEST TYPE="SALE" STORERECEIPT="0">
<AMOUNT>${formatEpayAmount(amount)}</AMOUNT>
<CARD>
<EAN>${ean}</EAN>
</CARD>
<COMMENT>CASHIERID=manager</COMMENT>
<EXTRADATA>
<DATA name="CONTRACT">${txid}</DATA>
</EXTRADATA>
<LOCALDATETIME>${getDateTimeFormat()}</LOCALDATETIME>
<PASSWORD>028eb6be0b280853</PASSWORD>
<RECEIPT>
<CHARSPERLINE>38</CHARSPERLINE>
<LANGUAGE>eng</LANGUAGE>
<LINES>40</LINES>
</RECEIPT>
<TERMINALID>93889311</TERMINALID>
<TXID>${txid}</TXID>
<USERNAME>UPTest_93889311</USERNAME>
</REQUEST>`;

  


  const response =
    await fetch(
      "https://precision.epayworldwide.com/up-interface/",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/xml",
          Accept:
            "application/xml",
          Connection:
            "close",
        },
        body:
          xmlPayload.trim(),
      }
    );

  const xml =
    await response.text();

  
    

  const parser =
    new XMLParser({
      ignoreAttributes: false,
    });

  const json =
    parser.parse(xml);

 

  return json;
}

export async function action({
  request,
}) {
  try {
    console.log(
      "🔥 ORDER PAID WEBHOOK HIT"
    );

    const payload =
      await request.json();

    const orderId =
      payload.id;

    const shop =
      request.headers.get(
        "x-shopify-shop-domain"
      );

      

    console.log(
      "ORDER ID:",
      orderId
    );

    const session =
      await prisma.session.findUnique({
        where: {
          id: `offline_${shop}`,
        },
      });

    if (!session) {
   
      

      return Response.json(
        {
          success: false,
          error:
            "Offline session not found",
        },
        {
          status: 404,
        }
      );
    }

 
    

    const lineItem =
      payload.line_items?.[0];

    const amount =
      lineItem?.price;

    const ean =
      lineItem?.sku;

  
      

    if (!ean) {
  
      

      return Response.json(
        {
          success: false,
          error:
            "SKU/EAN missing from order",
        },
        {
          status: 400,
        }
      );
    }


    const epayResponse =
      await callEpaySale(
        amount,
        ean
      );

    const metafieldMutation = `
      mutation SetMetafield(
        $metafields: [MetafieldsSetInput!]!
      ) {
        metafieldsSet(
          metafields: $metafields
        ) {
          metafields {
            id
            key
            namespace
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldResponse =
      await fetch(
        `https://${shop}/admin/api/2026-07/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "X-Shopify-Access-Token":
              session.accessToken,
          },
          body: JSON.stringify({
            query:
              metafieldMutation,
            variables: {
              metafields: [
                {
                  ownerId:
                    `gid://shopify/Order/${orderId}`,
                  namespace:
                    "epay",
                  key:
                    "result",
                  type:
                    "json",
                  value:
                    JSON.stringify(
                      epayResponse
                    ),
                },
              ],
            },
          }),
        }
      );

    const metafieldData =
      await metafieldResponse.json();

 
      


      

if (
  metafieldData?.data?.metafieldsSet
    ?.userErrors?.length
) {
  console.log(
    "METAFIELD ERRORS:",
    JSON.stringify(
      metafieldData.data
        .metafieldsSet
        .userErrors,
      null,
      2
    )
  );
}

    return Response.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "WEBHOOK ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}