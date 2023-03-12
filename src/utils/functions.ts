import { BigintIsh, ChainId, ERC20Token, JSBI } from "@pancakeswap/sdk"
import { getAddress } from "ethers/lib/utils"
import { memoize } from "lodash"
import { Location, NavigateFunction } from "react-router-dom"
import { PageRoutes } from "./constants"
import { activeChainId } from "./config"

export const doNothing = (): void => {}

type ActionType = "show" | "hide" | "toggle"

export const handleDropdown = (elementSelector: string, action: ActionType) => {
  const el = document.querySelector(elementSelector)
  if (!el) return
  if (action === "toggle") {
    if (el.classList.contains("active")) {
      el.classList.remove("active")
    } else {
      el.classList.add("active")
    }
    return
  }
  if (action === "hide") {
    el.classList.remove("active")
  } else {
    el.classList.add("active")
  }
}

export const handleProfileDropdown = (action: ActionType) =>
  handleDropdown(".profile-dropdown", action)

export const handleMobileNavDropdown = (action: ActionType) =>
  handleDropdown(".mobile-navigator-dropdown", action)

export const handleBodyScroll = (action: "enable" | "disable" = "enable") => {
  const el = document.querySelector("html")
  if (el) {
    if (action === "enable") {
      el.classList.remove("hide-overflow")
    } else {
      el.classList.add("hide-overflow")
    }
  }
}

export function parseBigintIsh(bigintIsh: BigintIsh): JSBI {
  return bigintIsh instanceof JSBI ? bigintIsh : JSBI.BigInt(bigintIsh)
}

export const isAddress = memoize((value: any): string | false => {
  try {
    return getAddress(value)
  } catch {
    return false
  }
})

export const shortenAddress = memoize((value: string): string => {
  const address = isAddress(value)
  if (!address) {
    return value
  }
  return `${address.slice(0, 5)}...${address.slice(-3)}`
})

export const canGoBack = (location: Location) => location.key !== "default"

export const goBackConditionally = (
  navigate: NavigateFunction,
  location: Location,
  page: PageRoutes
) => {
  if (canGoBack(location)) {
    navigate(-1)
    return
  }
  navigate(page)
}

const mapping = {
  [ChainId.BSC]: "smartchain",
  [ChainId.ETHEREUM]: "ethereum",
  [ChainId.BSC_TESTNET]: "",
}

export const getTokenLogoURL = memoize(
  (token?: ERC20Token) => {
    if (token && mapping[activeChainId]) {
      return `https://assets-cdn.trustwallet.com/blockchains/${
        mapping[activeChainId]
      }/assets/${getAddress(token.address)}/logo.png`
    }
    return undefined
  },
  (t) => `${t?.chainId}#${t?.address}`
)

export const getTokenLogoURLByAddress = memoize(
  (address?: string, chainId?: number) => {
    if (address && chainId && mapping[activeChainId]) {
      return `https://assets-cdn.trustwallet.com/blockchains/${
        mapping[activeChainId]
      }/assets/${getAddress(address)}/logo.png`
    }
    return null
  },
  (address, chainId) => `${chainId}#${address}`
)
