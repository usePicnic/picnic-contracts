import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";

const ONEINCH_ABI = [
    {
      inputs: [{ internalType: "contract IWETH", name: "weth", type: "address" }],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    { inputs: [], name: "AccessDenied", type: "error" },
    { inputs: [], name: "AdvanceNonceFailed", type: "error" },
    { inputs: [], name: "AlreadyFilled", type: "error" },
    { inputs: [], name: "ArbitraryStaticCallFailed", type: "error" },
    { inputs: [], name: "BadPool", type: "error" },
    { inputs: [], name: "BadSignature", type: "error" },
    { inputs: [], name: "ETHTransferFailed", type: "error" },
    { inputs: [], name: "ETHTransferFailed", type: "error" },
    { inputs: [], name: "EmptyPools", type: "error" },
    { inputs: [], name: "EthDepositRejected", type: "error" },
    { inputs: [], name: "GetAmountCallFailed", type: "error" },
    { inputs: [], name: "IncorrectDataLength", type: "error" },
    { inputs: [], name: "InsufficientBalance", type: "error" },
    { inputs: [], name: "InvalidMsgValue", type: "error" },
    { inputs: [], name: "InvalidMsgValue", type: "error" },
    { inputs: [], name: "InvalidatedOrder", type: "error" },
    { inputs: [], name: "MakingAmountExceeded", type: "error" },
    { inputs: [], name: "MakingAmountTooLow", type: "error" },
    { inputs: [], name: "OnlyOneAmountShouldBeZero", type: "error" },
    { inputs: [], name: "OrderExpired", type: "error" },
    { inputs: [], name: "PermitLengthTooLow", type: "error" },
    { inputs: [], name: "PredicateIsNotTrue", type: "error" },
    { inputs: [], name: "PrivateOrder", type: "error" },
    { inputs: [], name: "RFQBadSignature", type: "error" },
    { inputs: [], name: "RFQPrivateOrder", type: "error" },
    { inputs: [], name: "RFQSwapWithZeroAmount", type: "error" },
    { inputs: [], name: "RFQZeroTargetIsForbidden", type: "error" },
    { inputs: [], name: "ReentrancyDetected", type: "error" },
    { inputs: [], name: "RemainingAmountIsZero", type: "error" },
    { inputs: [], name: "ReservesCallFailed", type: "error" },
    { inputs: [], name: "ReturnAmountIsNotEnough", type: "error" },
    { inputs: [], name: "SafePermitBadLength", type: "error" },
    { inputs: [], name: "SafeTransferFailed", type: "error" },
    { inputs: [], name: "SafeTransferFromFailed", type: "error" },
    {
      inputs: [
        { internalType: "bool", name: "success", type: "bool" },
        { internalType: "bytes", name: "res", type: "bytes" },
      ],
      name: "SimulationResults",
      type: "error",
    },
    { inputs: [], name: "SwapAmountTooLarge", type: "error" },
    { inputs: [], name: "SwapWithZeroAmount", type: "error" },
    { inputs: [], name: "TakingAmountExceeded", type: "error" },
    { inputs: [], name: "TakingAmountIncreased", type: "error" },
    { inputs: [], name: "TakingAmountTooHigh", type: "error" },
    { inputs: [], name: "TransferFromMakerToTakerFailed", type: "error" },
    { inputs: [], name: "TransferFromTakerToMakerFailed", type: "error" },
    { inputs: [], name: "UnknownOrder", type: "error" },
    { inputs: [], name: "WrongAmount", type: "error" },
    { inputs: [], name: "WrongGetter", type: "error" },
    { inputs: [], name: "ZeroAddress", type: "error" },
    { inputs: [], name: "ZeroMinReturn", type: "error" },
    { inputs: [], name: "ZeroReturnAmount", type: "error" },
    { inputs: [], name: "ZeroTargetIsForbidden", type: "error" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "maker",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "newNonce",
          type: "uint256",
        },
      ],
      name: "NonceIncreased",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "maker",
          type: "address",
        },
        {
          indexed: false,
          internalType: "bytes32",
          name: "orderHash",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "remainingRaw",
          type: "uint256",
        },
      ],
      name: "OrderCanceled",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "maker",
          type: "address",
        },
        {
          indexed: false,
          internalType: "bytes32",
          name: "orderHash",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "remaining",
          type: "uint256",
        },
      ],
      name: "OrderFilled",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "orderHash",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "makingAmount",
          type: "uint256",
        },
      ],
      name: "OrderFilledRFQ",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [{ internalType: "uint8", name: "amount", type: "uint8" }],
      name: "advanceNonce",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "offsets", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "and",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "target", type: "address" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "arbitraryStaticCall",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "salt", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
            { internalType: "uint256", name: "offsets", type: "uint256" },
            { internalType: "bytes", name: "interactions", type: "bytes" },
          ],
          internalType: "struct OrderLib.Order",
          name: "order",
          type: "tuple",
        },
      ],
      name: "cancelOrder",
      outputs: [
        { internalType: "uint256", name: "orderRemaining", type: "uint256" },
        { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "orderInfo", type: "uint256" }],
      name: "cancelOrderRFQ",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "orderInfo", type: "uint256" },
        { internalType: "uint256", name: "additionalMask", type: "uint256" },
      ],
      name: "cancelOrderRFQ",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "salt", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
            { internalType: "uint256", name: "offsets", type: "uint256" },
            { internalType: "bytes", name: "interactions", type: "bytes" },
          ],
          internalType: "struct OrderLib.Order",
          name: "order",
          type: "tuple",
        },
      ],
      name: "checkPredicate",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IClipperExchangeInterface",
          name: "clipperExchange",
          type: "address",
        },
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "contract IERC20", name: "dstToken", type: "address" },
        { internalType: "uint256", name: "inputAmount", type: "uint256" },
        { internalType: "uint256", name: "outputAmount", type: "uint256" },
        { internalType: "uint256", name: "goodUntil", type: "uint256" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "vs", type: "bytes32" },
      ],
      name: "clipperSwap",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IClipperExchangeInterface",
          name: "clipperExchange",
          type: "address",
        },
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "contract IERC20", name: "dstToken", type: "address" },
        { internalType: "uint256", name: "inputAmount", type: "uint256" },
        { internalType: "uint256", name: "outputAmount", type: "uint256" },
        { internalType: "uint256", name: "goodUntil", type: "uint256" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "vs", type: "bytes32" },
      ],
      name: "clipperSwapTo",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IClipperExchangeInterface",
          name: "clipperExchange",
          type: "address",
        },
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "contract IERC20", name: "dstToken", type: "address" },
        { internalType: "uint256", name: "inputAmount", type: "uint256" },
        { internalType: "uint256", name: "outputAmount", type: "uint256" },
        { internalType: "uint256", name: "goodUntil", type: "uint256" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "vs", type: "bytes32" },
        { internalType: "bytes", name: "permit", type: "bytes" },
      ],
      name: "clipperSwapToWithPermit",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "destroy",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "eq",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "salt", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
            { internalType: "uint256", name: "offsets", type: "uint256" },
            { internalType: "bytes", name: "interactions", type: "bytes" },
          ],
          internalType: "struct OrderLib.Order",
          name: "order",
          type: "tuple",
        },
        { internalType: "bytes", name: "signature", type: "bytes" },
        { internalType: "bytes", name: "interaction", type: "bytes" },
        { internalType: "uint256", name: "makingAmount", type: "uint256" },
        { internalType: "uint256", name: "takingAmount", type: "uint256" },
        {
          internalType: "uint256",
          name: "skipPermitAndThresholdAmount",
          type: "uint256",
        },
      ],
      name: "fillOrder",
      outputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "bytes32", name: "", type: "bytes32" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "info", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
          ],
          internalType: "struct OrderRFQLib.OrderRFQ",
          name: "order",
          type: "tuple",
        },
        { internalType: "bytes", name: "signature", type: "bytes" },
        { internalType: "uint256", name: "flagsAndAmount", type: "uint256" },
      ],
      name: "fillOrderRFQ",
      outputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "bytes32", name: "", type: "bytes32" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "info", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
          ],
          internalType: "struct OrderRFQLib.OrderRFQ",
          name: "order",
          type: "tuple",
        },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "vs", type: "bytes32" },
        { internalType: "uint256", name: "flagsAndAmount", type: "uint256" },
      ],
      name: "fillOrderRFQCompact",
      outputs: [
        { internalType: "uint256", name: "filledMakingAmount", type: "uint256" },
        { internalType: "uint256", name: "filledTakingAmount", type: "uint256" },
        { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "info", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
          ],
          internalType: "struct OrderRFQLib.OrderRFQ",
          name: "order",
          type: "tuple",
        },
        { internalType: "bytes", name: "signature", type: "bytes" },
        { internalType: "uint256", name: "flagsAndAmount", type: "uint256" },
        { internalType: "address", name: "target", type: "address" },
      ],
      name: "fillOrderRFQTo",
      outputs: [
        { internalType: "uint256", name: "filledMakingAmount", type: "uint256" },
        { internalType: "uint256", name: "filledTakingAmount", type: "uint256" },
        { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "info", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
          ],
          internalType: "struct OrderRFQLib.OrderRFQ",
          name: "order",
          type: "tuple",
        },
        { internalType: "bytes", name: "signature", type: "bytes" },
        { internalType: "uint256", name: "flagsAndAmount", type: "uint256" },
        { internalType: "address", name: "target", type: "address" },
        { internalType: "bytes", name: "permit", type: "bytes" },
      ],
      name: "fillOrderRFQToWithPermit",
      outputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "bytes32", name: "", type: "bytes32" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "salt", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
            { internalType: "uint256", name: "offsets", type: "uint256" },
            { internalType: "bytes", name: "interactions", type: "bytes" },
          ],
          internalType: "struct OrderLib.Order",
          name: "order_",
          type: "tuple",
        },
        { internalType: "bytes", name: "signature", type: "bytes" },
        { internalType: "bytes", name: "interaction", type: "bytes" },
        { internalType: "uint256", name: "makingAmount", type: "uint256" },
        { internalType: "uint256", name: "takingAmount", type: "uint256" },
        {
          internalType: "uint256",
          name: "skipPermitAndThresholdAmount",
          type: "uint256",
        },
        { internalType: "address", name: "target", type: "address" },
      ],
      name: "fillOrderTo",
      outputs: [
        { internalType: "uint256", name: "actualMakingAmount", type: "uint256" },
        { internalType: "uint256", name: "actualTakingAmount", type: "uint256" },
        { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "salt", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
            { internalType: "uint256", name: "offsets", type: "uint256" },
            { internalType: "bytes", name: "interactions", type: "bytes" },
          ],
          internalType: "struct OrderLib.Order",
          name: "order",
          type: "tuple",
        },
        { internalType: "bytes", name: "signature", type: "bytes" },
        { internalType: "bytes", name: "interaction", type: "bytes" },
        { internalType: "uint256", name: "makingAmount", type: "uint256" },
        { internalType: "uint256", name: "takingAmount", type: "uint256" },
        {
          internalType: "uint256",
          name: "skipPermitAndThresholdAmount",
          type: "uint256",
        },
        { internalType: "address", name: "target", type: "address" },
        { internalType: "bytes", name: "permit", type: "bytes" },
      ],
      name: "fillOrderToWithPermit",
      outputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "bytes32", name: "", type: "bytes32" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "gt",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint256", name: "salt", type: "uint256" },
            { internalType: "address", name: "makerAsset", type: "address" },
            { internalType: "address", name: "takerAsset", type: "address" },
            { internalType: "address", name: "maker", type: "address" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "allowedSender", type: "address" },
            { internalType: "uint256", name: "makingAmount", type: "uint256" },
            { internalType: "uint256", name: "takingAmount", type: "uint256" },
            { internalType: "uint256", name: "offsets", type: "uint256" },
            { internalType: "bytes", name: "interactions", type: "bytes" },
          ],
          internalType: "struct OrderLib.Order",
          name: "order",
          type: "tuple",
        },
      ],
      name: "hashOrder",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "increaseNonce",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "maker", type: "address" },
        { internalType: "uint256", name: "slot", type: "uint256" },
      ],
      name: "invalidatorForOrderRFQ",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "lt",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "nonce",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "makerAddress", type: "address" },
        { internalType: "uint256", name: "makerNonce", type: "uint256" },
      ],
      name: "nonceEquals",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "offsets", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "or",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
      name: "remaining",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
      name: "remainingRaw",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes32[]", name: "orderHashes", type: "bytes32[]" },
      ],
      name: "remainingsRaw",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "contract IERC20", name: "token", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "rescueFunds",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "target", type: "address" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "simulate",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IAggregationExecutor",
          name: "executor",
          type: "address",
        },
        {
          components: [
            {
              internalType: "contract IERC20",
              name: "srcToken",
              type: "address",
            },
            {
              internalType: "contract IERC20",
              name: "dstToken",
              type: "address",
            },
            {
              internalType: "address payable",
              name: "srcReceiver",
              type: "address",
            },
            {
              internalType: "address payable",
              name: "dstReceiver",
              type: "address",
            },
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "uint256", name: "minReturnAmount", type: "uint256" },
            { internalType: "uint256", name: "flags", type: "uint256" },
          ],
          internalType: "struct GenericRouter.SwapDescription",
          name: "desc",
          type: "tuple",
        },
        { internalType: "bytes", name: "permit", type: "bytes" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "swap",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
        { internalType: "uint256", name: "spentAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "time", type: "uint256" }],
      name: "timestampBelow",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "timeNonceAccount", type: "uint256" },
      ],
      name: "timestampBelowAndNonceEquals",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "minReturn", type: "uint256" },
        { internalType: "uint256[]", name: "pools", type: "uint256[]" },
      ],
      name: "uniswapV3Swap",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "int256", name: "amount0Delta", type: "int256" },
        { internalType: "int256", name: "amount1Delta", type: "int256" },
        { internalType: "bytes", name: "", type: "bytes" },
      ],
      name: "uniswapV3SwapCallback",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "minReturn", type: "uint256" },
        { internalType: "uint256[]", name: "pools", type: "uint256[]" },
      ],
      name: "uniswapV3SwapTo",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "minReturn", type: "uint256" },
        { internalType: "uint256[]", name: "pools", type: "uint256[]" },
        { internalType: "bytes", name: "permit", type: "bytes" },
      ],
      name: "uniswapV3SwapToWithPermit",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "minReturn", type: "uint256" },
        { internalType: "uint256[]", name: "pools", type: "uint256[]" },
      ],
      name: "unoswap",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "minReturn", type: "uint256" },
        { internalType: "uint256[]", name: "pools", type: "uint256[]" },
      ],
      name: "unoswapTo",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "contract IERC20", name: "srcToken", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "minReturn", type: "uint256" },
        { internalType: "uint256[]", name: "pools", type: "uint256[]" },
        { internalType: "bytes", name: "permit", type: "bytes" },
      ],
      name: "unoswapToWithPermit",
      outputs: [
        { internalType: "uint256", name: "returnAmount", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    { stateMutability: "payable", type: "receive" },
  ];

  const ONEINCH_ADDRESS = "0x1111111254EEB25477B68fb85Ed929f73A960582";

// TODO this bridge is work in progress

describe("QuickswapLiquidityBridge", function () {
    let owner;
    let other;
    let UniswapV2SwapBridge;
    let uniswapV2SwapBridge;
    let wallet;
    let oneInchBridge;
    let wmaticBridge;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        // Get 2 signers to enable to test for permission rights
        [owner, other] = await ethers.getSigners();

        // Instantiate Uniswap bridge
        UniswapV2SwapBridge = await ethers.getContractFactory("QuickswapSwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        let OneInchBridge = await ethers.getContractFactory("OneInchBridge");
        oneInchBridge = await OneInchBridge.deploy();

        let WMaticBridge = await ethers.getContractFactory("WMaticWrapBridge");
        wmaticBridge = await WMaticBridge.deploy();

        // Instantiate Wallet
        let Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
    });

    describe("Actions", function () {
        it("One Inch - Altered Swap", async function () {

            const sellAmount = ethers.utils.parseEther("1").toString();
            const fromAddress = "0x81ae7583f06c2bc141b9141fb9d701f0f2f59133";
            const chainId = 137;
                        
            const url = `https://api.1inch.io/v5.0/${chainId}/swap?fromTokenAddress=${TOKENS['WMAIN']}&toTokenAddress=${TOKENS['WETH']}&amount=${sellAmount}&fromAddress=${fromAddress}&slippage=50&disableEstimate=true`;
            const req = await fetch(url);
            const data = await req.json();
            const minReturnAmount = "10000000";

            console.log({data})

            const contract = new ethers.Contract(ONEINCH_ADDRESS, ONEINCH_ABI);

            const decodedTx = await contract.interface.parseTransaction({
                data: data.tx.data,
            });

            console.log({decodedTx});
            console.log(decodedTx.args.desc);


            // Set bridges addresses
            var _bridgeAddresses = [
                wmaticBridge.address,
                oneInchBridge.address,
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                wmaticBridge.interface.encodeFunctionData(
                    "wrap",
                    [
                        100000
                    ],
                ),
                oneInchBridge.interface.encodeFunctionData(
                    "swap",
                    [
                        data.tx.to, // address oneInchAddress,
                        minReturnAmount, // uint256 minReturnAmount,
                        decodedTx.args.executor, // IAggregationExecutor executor,
                        decodedTx.args.desc, // SwapDescription calldata desc,
                        decodedTx.args.permit, // bytes calldata permit,
                        decodedTx.args.data, // bytes calldata data
                    ],
                ),
            ];

            // Transfer money to wallet (similar as DeFi Basket contract would have done)
            const transactionHash = await owner.sendTransaction({
                to: wallet.address,
                value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
            });
            await transactionHash.wait();

            // Execute bridge calls (buys DAI on Uniswap and deposit on Aave)
            await wallet.useBridges(
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wallet DAI amount should be 0
            let lpToken = await ethers.getContractAt(
                "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
                TOKENS['WETH'])
            let lpTokenBalance = await lpToken.balanceOf(wallet.address);
            expect(lpTokenBalance).to.be.above(0);
        });
    });
});
