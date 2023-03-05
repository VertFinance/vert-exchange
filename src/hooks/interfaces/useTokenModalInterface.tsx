import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useAtom, useAtomValue } from "jotai"
import { ERC20Token } from "@pancakeswap/sdk"
import { activeChainId } from "../../utils/config"
import { pinnedTokens } from "../../utils/constants/exchange"
import PinnedToken from "../../components/transactions/PinnedToken"
import { handleSetExchangeAtomCreator } from "../../state/exchange/atoms"
import useModal from "../useModal"
import { isAddress } from "../../utils"
import { useSingleContractWithCallData } from "../../utils/multicall"
import { blockNumberAtom } from "../../state/blockAtoms"
import getContracts from "../../utils/getContracts"
import ResolvedToken from "../../components/transactions/ResolvedToken"
import TokenRow from "../../components/transactions/TokenRow"
import InactiveToken from "../../components/transactions/InactiveToken"

export enum Steps {
  IMPORT_TOKEN = "IMPORT_TOKEN",
  DEFAULT = "DEFAULT",
  CUSTOM_TOKENS = "CUSTOM_TOKENS",
}

interface ReturnTypes {
  pinnedTokens: JSX.Element[]
  tokenList: JSX.Element[]
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  resolvedTokenElement: JSX.Element | null
  otherTokenList: JSX.Element[]
  resolvedToken: ERC20Token | null
  currentStep: Steps
  setCurrentStep: React.Dispatch<React.SetStateAction<Steps>>
  selectedInactiveToken: [ERC20Token, string] | null
}

const { erc20Token } = getContracts()
const erc20TokenInterface = erc20Token.interface
const callDatas: string[] = [
  erc20TokenInterface.encodeFunctionData("name"),
  erc20TokenInterface.encodeFunctionData("symbol"),
  erc20TokenInterface.encodeFunctionData("decimals"),
]

let tokenList: JSX.Element[] = []
let otherTokenList: JSX.Element[] = []

const tokenstoElements = (
  tokens: ERC20Token[],
  searchQuery: string,
  logos: string[],
  handleSelectToken: (token: ERC20Token, logo: string) => void,
  component: (props: {
    token: ERC20Token
    logo: string
    handleClick: (token: ERC20Token, logo: string) => void
  }) => JSX.Element
): JSX.Element[] => {
  const query = searchQuery.trim().toLowerCase()

  return (
    tokens
      .map<[ERC20Token, string]>((token, index) => [token, logos[index]])
      // filter tokens with searchQuery
      .filter(
        ([token]) =>
          token.symbol.toLowerCase().includes(query) ||
          token.name?.toLowerCase().includes(query) ||
          token.address.toLowerCase() === query.trim()
      )
      // sort tokens
      .sort(([a], [b]) =>
        a.symbol.localeCompare(b.symbol, "en", { sensitivity: "base" })
      )
      // map tokens to token element
      .map(([token, logo]) =>
        component({ token, logo, handleClick: handleSelectToken })
      )
  )
}

const useTokenModalInterface = (
  tokens: ERC20Token[],
  logos: string[],
  otherTokens: ERC20Token[],
  otherLogos: string[]
): ReturnTypes => {
  const [, setSellToken] = useAtom(
    useMemo(
      () =>
        handleSetExchangeAtomCreator<
          "sellToken",
          { token: ERC20Token; logo: string }
        >(),
      []
    )
  )
  const [currentStep, setCurrentStep] = useState<Steps>(Steps.DEFAULT)
  const { hideModal, isActive } = useModal("TOKEN_MODAL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInactiveToken, setSelectedInactiveToken] = useState<
    null | [ERC20Token, string]
  >(null)
  const blockNumber = useAtomValue(blockNumberAtom)

  // resolve token when user enters address in searchQuery
  const erc20TokenQuery = useMemo(
    () =>
      isAddress(searchQuery) &&
      tokenList.length === 0 &&
      otherTokenList.length === 0
        ? erc20Token.attach(isAddress(searchQuery) as string)
        : erc20Token,
    [searchQuery]
  )

  const results = useSingleContractWithCallData(
    activeChainId,
    blockNumber,
    erc20TokenQuery,
    callDatas
  )

  // confirm if token has been resolved
  const resolvedToken = useMemo(
    () =>
      results.length > 0 &&
      // make sure results is valid
      results.reduce((prev, curr) => prev && curr.valid && !!curr.result, true)
        ? new ERC20Token(
            activeChainId,
            erc20TokenQuery.address,
            results[2].result?.[0],
            results[1].result?.[0],
            results[0].result?.[0]
          )
        : null,
    [erc20TokenQuery.address, results]
  )

  const resolvedTokenElement = useMemo(
    () =>
      resolvedToken ? (
        <ResolvedToken
          token={resolvedToken}
          logo=""
          handleClick={() => setCurrentStep(Steps.IMPORT_TOKEN)}
        />
      ) : null,
    [resolvedToken]
  )

  const handleSelectToken = useCallback(
    (token: ERC20Token, logo: string) => {
      setSellToken({ key: "sellToken", value: { token, logo } })
      hideModal()
    },
    [hideModal, setSellToken]
  )

  const pinnedTokensList = useMemo(
    () =>
      pinnedTokens[activeChainId].map(([token, logo]) => (
        <PinnedToken
          onClick={() => handleSelectToken(token, logo)}
          key={token.address}
          name={token.symbol}
          icon={logo}
          className="mb-1 mr-[6px] cursor-pointer"
        />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  tokenList = useMemo(
    () =>
      tokenstoElements(tokens, searchQuery, logos, handleSelectToken, TokenRow),
    [tokens, logos, searchQuery, handleSelectToken]
  )

  const handleClickInactiveToken = (token: ERC20Token, logo: string) => {
    setSelectedInactiveToken([token, logo])
    setCurrentStep(Steps.IMPORT_TOKEN)
  }

  otherTokenList = useMemo(() => {
    // return empty list until a search occurs
    if (searchQuery.trim() === "") {
      return []
    }
    return (
      tokenstoElements(
        otherTokens,
        searchQuery,
        otherLogos,
        handleClickInactiveToken,
        InactiveToken
      )
        // return 50 to manage resources
        .slice(0, 49)
    )
  }, [otherLogos, otherTokens, searchQuery])

  // clear searchQuery when modal closes
  useEffect(() => {
    if (!isActive) {
      setSearchQuery("")
    }
  }, [isActive])

  return {
    pinnedTokens: pinnedTokensList,
    tokenList,
    otherTokenList,
    searchQuery,
    setSearchQuery,
    resolvedTokenElement,
    resolvedToken,
    currentStep,
    setCurrentStep,
    selectedInactiveToken,
  }
}

export default useTokenModalInterface
