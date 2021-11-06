import { Client, MessageEmbed } from "discord.js";
import {
  Pool,
  Trade,
  Route,
  Position,
  NonfungiblePositionManager,
  nearestUsableTick,
} from "@uniswap/v3-sdk";
import { CurrencyAmount, Token, Percent, TradeType } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { abi as QuoterABI } from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import Web3 from "web3";
require("dotenv").config();
const { fetchJson } = require("fetch-json");

const AUTHOR = "@aleadorjan";
const BOT_NAME = "UniSwapDiscordBot";
const BOT_NAME_FOOTER = "HACK THE FUTURE OF UNISWAP PROTOCOL";
const EMBED_COLOR_PRIMARY = 0x285fd0;
const EMBED_COLOR_SECONDARY = 0xffffff;
const GITHUB_URL = "https://github.com/aadorian/uniswapdiscordbot.git";
const THUMBNAIL =
  "https://siasky.net/bAA1dE3or8k2QcQixRb5GerGFbmd8V3tQitdw7TXawTxIQ";
const LOGO =
  "https://siasky.net/fAJTZQAY5qG1bimowCYREDbYeXpPdMFxaCRg-hs4pYGprg";

const ABOUT_UNISWAP =
  "A suite of persistent, non-upgradable smart contracts that together create an automated market maker, a protocol that facilitates peer-to-peer market making and swapping of ERC-20 tokens on the Ethereum blockchain";
const ABOUT_POOL =
  "A contract deployed by the V3 factory that pairs two ERC-20 assets. Different pools may have different fees despite containing the same token pair. Pools were previously called Pairs before the introduction of multiple fee options.";
const URL_BOT = "https://hack.ethglobal.com/unicode";
const URL_GLOSSARY =
  "https://docs.uniswap.org/protocol/concepts/V3-overview/glossary#pool";
const MNEMONIC = process.env.MNEMONIC;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const SENDER_ADDRESS = PUBLIC_KEY;
const UNI_ADDRESS = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
const TOKEN_NAME = "UNI";
console.log(`Starting bot...`);
console.log(`Connecting web3 to ` + process.env.RPC_URL);

const client: Client = new Client();
const web3 = new Web3(process.env.RPC_URL);
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const poolImmutablesABI = [
  "function factory() external view returns (address)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function maxLiquidityPerTick() external view returns (uint128)",
];
async function getPoolImmutablesABI() {
  const PoolImmutables: Immutables = {
    factory: await poolContract.factory(),
    token0: await poolContract.token0(),
    token1: await poolContract.token1(),
    fee: await poolContract.fee(),
    tickSpacing: await poolContract.tickSpacing(),
    maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
  };
  return PoolImmutables;
}

// pool address for DAI/USDC 0.05%
const POOLADDRESSPAIR = "DAI/USDC 0.005";
const poolAddress = "0x6c6bc977e13df9b0de53b251522280bb72383700";

const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABI,
  provider
);

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

async function getPoolImmutables() {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
    await Promise.all([
      poolContract.factory(),
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.maxLiquidityPerTick(),
    ]);

  const immutables: Immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  };
  return immutables;
}

async function getPoolState() {
  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const PoolState: State = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const quoterContract = new ethers.Contract(quoterAddress, QuoterABI, provider);
console.log(`Quoter address: ${quoterAddress}`);

client.on("message", async (msg) => {
  try {
    if (msg.content === "!about") {
      const msgEmbed = new MessageEmbed()
        .setTitle(BOT_NAME)
        .setURL(URL_BOT)
        .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
        .setDescription(ABOUT_UNISWAP)
        .setThumbnail(THUMBNAIL)
        .addFields(
          { name: "pool address", value: poolAddress },
          { name: "address", value: quoterAddress, inline: true },
          { name: "sdk", value: '@uniswap/sdk-core @uniswap/v3-sdk', inline: true },
          { name: "github", value: GITHUB_URL },
        )
        .addField("help command", "!help", true)
        .setImage(LOGO)
        .setFooter(BOT_NAME_FOOTER, THUMBNAIL)
        .setTimestamp();
      msg.channel.send(msgEmbed);

    }
    if (msg.content === "!balance") {
      const url =
        "https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=" +
        SENDER_ADDRESS +
        "&apikey=" +
        process.env.API_ETHERSCAN;
      const data = await fetchJson.get(url);
      console.log(data);
      const accountBalance = BigInt(await web3.eth.getBalance(SENDER_ADDRESS));
      const msgEmbed = new MessageEmbed()
        .setColor(EMBED_COLOR_PRIMARY)
        .setDescription(BOT_NAME)
        .setURL(URL_BOT)
        .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
        .setThumbnail(THUMBNAIL)
        .addField("your current public address ", `${SENDER_ADDRESS}`)
        .addField("UNI contract address ", `${UNI_ADDRESS}`)
        .addField(
          "ETH balance ",
          `${accountBalance / 10n ** 18n} ${TOKEN_NAME}`,
          true
        )
        .addField(`${TOKEN_NAME} balance`, `${data.result}`)
        .setImage(LOGO)
        .setFooter(BOT_NAME_FOOTER, LOGO)
        .setTimestamp();
      msg.channel.send(msgEmbed);
    }
    if (msg.content === "!help") {
      const msgEmbed = new MessageEmbed()
        .setTitle(BOT_NAME)
        .setURL(URL_BOT)
        .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
        .setDescription(ABOUT_UNISWAP)
        .setThumbnail(THUMBNAIL)
        .addFields(
          { name: "about this bot"  , value: '!about'},
          { name: "pool inmutable ABI", value: '!poolInmutablesABI', inline: true },
          { name: "balance ", value: '!balance', inline: true },
          { name: "pool state ", value: '!getPoolState', inline: true },
          { name: "position ", value: '!getPosition', inline: true },
          { name: "swap ", value: '!swapExample', inline: true }
        )

        .setImage(LOGO)
        .setFooter(BOT_NAME_FOOTER, THUMBNAIL)
        .setTimestamp();
      msg.channel.send(msgEmbed);

    }
    if (msg.content === "!poolImmutablesABI") {
      //https://docs.uniswap-finance.org/sdk/guides/using-ethers
      console.log(poolImmutablesABI);
      getPoolImmutablesABI().then((result) => {
        const msgEmbed = new MessageEmbed()
          .setColor(EMBED_COLOR_PRIMARY)
          .setDescription(BOT_NAME)
          .setURL(URL_GLOSSARY)
          .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
          .setThumbnail(THUMBNAIL)
          .addField("Pool", `${ABOUT_POOL}`)
          .addField("factory ", `${result.factory}`)
          .addField("token0 ", `${result.token0}`)
          .addField(
            `token0 EtherScan ${result.token0}`,
            `https://etherscan.io/address/${result.token0}`
          )
          .addField(
            `token1 EtherScan ${result.token1}`,
            `https://etherscan.io/address/${result.token1}`
          )
          .addField("fee", `${result.fee}`)
          .addField("tickSpacing", `${result.tickSpacing}`)
          .setImage(LOGO)
          .setFooter(BOT_NAME_FOOTER, LOGO)
          .setTimestamp();
        msg.channel.send(msgEmbed);
      });
    }
    if (msg.content === "!getPoolState") {
      let sender = SENDER_ADDRESS;
      const block = await provider.getBlock(provider.getBlockNumber());
      const deadline = block.timestamp + 200;
      const immutables = await getPoolImmutables();
      const state = await getPoolState();
      const DAI = new Token(1, immutables.token0, 18, "DAI", "Stablecoin");
      const USDC = new Token(1, immutables.token1, 18, "USDC", "USD Coin");
      const msgEmbed = new MessageEmbed()
        .setColor(EMBED_COLOR_PRIMARY)
        .setDescription(BOT_NAME)
        .setURL(URL_BOT)
        .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
        .setThumbnail(THUMBNAIL)
        .addField(
          "Block ",
          " number " +
            block.number +
            " timestamp " +
            block.timestamp +
            " deadline" +
            deadline,
          true
        )
        .addField(
          "Immutables",
          " token0: DAI " + DAI.address + " token1: USDC " + USDC.address,
          true
        )
        .addField(
          "State Observation",
          `tick  ${state.tick}  index 
          ${state.observationIndex}` +
            `cardinality  
            ${state.observationCardinality} 
            cardinalityNext  
            ${state.observationCardinalityNext}`,
          true
        )
        .addField("feeProtocol", state.feeProtocol, true)
        .addField("unlocked", state.unlocked, true)
        .addField("liquidity", state.liquidity, true)
        .setImage(LOGO)
        .setFooter(BOT_NAME_FOOTER, LOGO)
        .setTimestamp();
      msg.channel.send(msgEmbed);
    }
    if (msg.content === "!getPosition") {
      let sender = SENDER_ADDRESS;
      const block = await provider.getBlock(provider.getBlockNumber());
      const deadline = block.timestamp + 200;
      const immutables = await getPoolImmutables();
      const state = await getPoolState();
      const DAI = new Token(1, immutables.token0, 18, "DAI", "Stablecoin");
      const USDC = new Token(1, immutables.token1, 18, "USDC", "USD Coin");
      const DAI_USDC_POOL = new Pool(
        DAI,
        USDC,
        immutables.fee,
        state.sqrtPriceX96.toString(),
        state.liquidity.toString(),
        state.tick
      );
      const position = new Position({
        pool: DAI_USDC_POOL,
        liquidity: state.liquidity.mul(1).toString(),
        tickLower:
          nearestUsableTick(state.tick, immutables.tickSpacing) -
          immutables.tickSpacing * 2,
        tickUpper:
          nearestUsableTick(state.tick, immutables.tickSpacing) +
          immutables.tickSpacing * 2,
      });
      const msgEmbed = new MessageEmbed()
        .setColor(EMBED_COLOR_PRIMARY)
        .setDescription(BOT_NAME)
        .setURL(URL_GLOSSARY)
        .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
        .setThumbnail(THUMBNAIL)
        .addField(
          "token0",
          `name: ${position.pool.token0.name} symbol: ${position.pool.token0.symbol}  address: ${position.pool.token0.address}`,
          true
        )
        .addField(
          "token1",
          `name: ${position.pool.token1.name} symbol: ${position.pool.token1.symbol}  address: ${position.pool.token1.address}`,
          true
        )
        .addField("liquidity", `${position.liquidity}`, true)
        .addField("tick lower", ` ${position.tickLower}`, true)
        .addField("tick upper", ` ${position.tickUpper}`, true)
        .setImage(LOGO)
        .setFooter(BOT_NAME_FOOTER, LOGO)
        .setTimestamp();
      msg.channel.send(msgEmbed);

      let exampleType = 0;
      // Example 0: Setting up calldata for minting a Position
      if (exampleType == 0) {
        const { calldata, value } =
          NonfungiblePositionManager.addCallParameters(position, {
            slippageTolerance: new Percent(50, 10_000),
            recipient: sender,
            deadline: deadline,
          });
        console.log(value);
      }

      // Example 1: Setting up calldata for adding liquidity to Position
      if (exampleType == 1) {
        const { calldata, value } =
          NonfungiblePositionManager.addCallParameters(position, {
            slippageTolerance: new Percent(50, 10_000),
            deadline: deadline,
            tokenId: 1,
          });
      }

      // Example 2: Setting up calldata for removing liquidity from Position
      if (exampleType == 2) {
        const { calldata, value } =
          NonfungiblePositionManager.removeCallParameters(position, {
            tokenId: 1,
            liquidityPercentage: new Percent(1),
            slippageTolerance: new Percent(50, 10_000),
            deadline: deadline,
            collectOptions: {
              expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(DAI, 0),
              expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(USDC, 0),
              recipient: sender,
            },
          });
      }

      //const accountBalance = BigInt(await web3.eth.getBalance(SENDER_ADDRESS));

      client.user.setActivity("tokens", { type: "WATCHING" });
      // client.user.setAvatar(IMAGE_DEFAULT)
    }
    if (msg.content === "!swapExample") {
      const [immutables, state] = await Promise.all([
        getPoolImmutables(),
        getPoolState(),
      ]);

      const TokenA = new Token(3, immutables.token0, 6, "USDC", "USD Coin");

      const TokenB = new Token(
        3,
        immutables.token1,
        18,
        "WETH",
        "Wrapped Ether"
      );

      const poolExample = new Pool(
        TokenA,
        TokenB,
        immutables.fee,
        state.sqrtPriceX96.toString(),
        state.liquidity.toString(),
        state.tick
      );
      console.log(poolExample);
      // assign an input amount for the swap
      const amountIn = 1500;
      // call the quoter contract to determine the amount out of a swap, given an amount in
      const quotedAmountOut =
        await quoterContract.callStatic.quoteExactInputSingle(
          immutables.token0,
          immutables.token1,
          immutables.fee,
          amountIn.toString(),
          0
        );
      console.log(quotedAmountOut);
      // create an instance of the route object in order to construct a trade object
      const swapRoute = new Route([poolExample], TokenA, TokenB);

      // create an unchecked trade instance
      const uncheckedTradeExample = await Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(TokenA, amountIn.toString()),
        outputAmount: CurrencyAmount.fromRawAmount(
          TokenB,
          quotedAmountOut.toString()
        ),
        tradeType: TradeType.EXACT_INPUT,
      });
      // print the quote and the unchecked trade instance in the console
      console.log("The quoted amount out is", quotedAmountOut.toString());
      console.log("The unchecked trade object is", uncheckedTradeExample);
     const msgEmbed = new MessageEmbed()
        .setColor(EMBED_COLOR_PRIMARY)
        .setDescription(BOT_NAME)
        .setURL(URL_BOT)
        .setAuthor("Author: " + AUTHOR, THUMBNAIL, URL_BOT)
        .setThumbnail(THUMBNAIL)
     
        .addField(
          "tradeType ",
          uncheckedTradeExample.tradeType
        )
        .addField(
          "poolExample",
          JSON.stringify(poolExample)
        )
        .addField(
          "The quoted amount in is ",
          amountIn.toString()
        )
        .addField(
          "The quoted amount out is ",
          quotedAmountOut.toString()
        )
        .addField(
          "route ",
          uncheckedTradeExample.swaps[0].route.chainId.toString()
          
        )
        .addField(
          "address ",
          uncheckedTradeExample.swaps[0].route.input.address.toString()
          
        )
        
        .setImage(LOGO)
        .setFooter(BOT_NAME_FOOTER, LOGO)
        .setTimestamp();
      msg.channel.send(msgEmbed);

      client.user.setActivity("tokens", { type: "WATCHING" });
      // client.user.setAvatar(IMAGE_DEFAULT)
    }
  } catch (e) {
    msg.reply("ERROR");
    console.log(new Date().toISOString(), "ERROR", e.stack || e);
  }
});

client.login(process.env.DISCORD_TOKEN);
