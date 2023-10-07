/* match contract address and return name.html */
export function address_to_name(chain, address) {
  let collection_name = "";
  if (chain == "Fantom") {
    switch (address) {
      case "0x37cA384bc7Dcf7aa2b71D30Af2b6F09e5746d2AC":
        collection_name = "wessgrave-bk";
        break;
      case "0xD813DA9995C753145927e25b8ecc18E6bF2b6AE0":
        collection_name = "hunters-of-evil";
        break;
      case "0x119E36192F2156305C5AD72978dd77714bE32f0D":
        collection_name = "wessgrave-lil-hoe";
        break;
      case "0xb410F4b0923bB315817264c256c4415D0F633771":
        collection_name = "wessgrave-bk-mw";
        break;
      case "0x6D44FD8cEC6666e2080493D4f157b066c3913437":
        collection_name = "ghosties";
        break;
      case "0xA314f73385C056fba328Db4461Ce383170909126":
        collection_name = "dark-ones";
        break;
      case "0x35372b723340B3bB62d3ae4723ad743C298F4F8c":
        collection_name = "death-dead-heads";
        break;
      case "0x3D770b78616B9C7dcCb2E089D2513Ab788540316":
        collection_name = "death-afterlife-beasts";
        break;
      case "0x293a78018314f440D022a68b9585B2C547261581":
        collection_name = "death-baby-beasts";
        break;
      case "0x8d9Ab6Aa28720a28D75CA157F7E16E9109520bAd":
        collection_name = "black-market";
        break;
      case "0x38f3a318e8AC7742bFCdE48F08cabA27e0056831":
        collection_name = "inmates-collection";
        break;
      case "0x75A5883fE77f5DA2369d24b2dA242A3e46631476":
        collection_name = "the-blood-lords";
        break;
      case "0xf1c2F870C113E10B549a1E2Ca787807967f2D269":
        collection_name = "classics";
        break;
      case "0xF1dd513016C17b181c1272dCDa5dFD7a4Ec75abB":
        collection_name = "bit-creations";
        break;
    }
  } else if (chain == "Avalanche") {
    switch (address) {
      case "0x219EA18f9f150507a0481bA4E809ea36fb7057fF":
        collection_name = "wessgrave-bk";
        break;
      case "0xc991Eb54dEa1CC20d5B945AEA63ffE69192CB3CF":
        collection_name = "hunters-of-evil";
        break;
      case "0x546E402D6e9a625bD17fC31a672D91Df85527cfC":
        collection_name = "inmates-collection";
        break;
      case "0x9a62e2A27231Aa58887ddc90f8711a12C9bD784C":
        collection_name = "crazy-lads";
        break;
      case "0x8b71733a4F481d036fE4e8c12a95f2E967cb9690":
        collection_name = "dreamerz";
        break;
    }
  } else if (chain == "Ethereum") {
    switch (address) {
        case "0x5cBAE2cA03f781C45CB7D8C6e810a1c0149Ca97e":
            collection_name = "she-reaps";
            break;
        case "0xF2cE188C30c29499C9F4f8Ee64346D24626263C7":
            collection_name = "skull-kingz";
            break;
    }
  }
  var output_url = "/" + collection_name;
  return output_url;
}
