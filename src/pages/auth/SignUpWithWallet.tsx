import React from "react"
import { useForm, Controller } from "react-hook-form"
import isEmail from "validator/lib/isEmail"
import { Link } from "react-router-dom"
import { ReactComponent as LoneLogo } from "../../assets/icons/logo-lone.svg"
import { Button, Glow, Wrapper } from "../../components/general"
import Input from "../../components/inputs/Input"
import { PageRoutes } from "../../utils/constants"
import ConnectWallet from "../../components/transactions/ConnectWallet"
import useModal from "../../hooks/useModal"
import { BackButton } from "../../components/navigation"

interface SignUpWithEmailValues {
  email: string
  username: string
}

export default function SignUpWithWallet() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignUpWithEmailValues>()
  const { showModal } = useModal()
  const onSubmit = handleSubmit((data) => {
    localStorage.setItem("data", JSON.stringify(data))
    showModal({ modal: "CONNECT_WALLET" })
  })
  return (
    <Wrapper hideTopNav>
      <Glow />
      <ConnectWallet />
      <div className="flex justify-center pt-[58px]">
        <div className="flex flex-col justify-center items-center space-y-[50.75px] mb-[276px]">
          <LoneLogo />
          <div className="flex flex-col space-y-8">
            <p className="text-white text-center text-lg">Sign up</p>
            <div className="bg-lightGreen rounded-xl w-[349px] p-7">
              <form className="flex flex-col space-y-4" onSubmit={onSubmit}>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: true,
                    validate: (v) => isEmail(v?.trim()),
                  }}
                  render={({ field }) => (
                    <Input
                      placeholder="Email Address"
                      autoFocus
                      errorMessage="The email you entered is not in the correct format. Please check."
                      type="email"
                      hasError={!!errors.email}
                      {...field}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="username"
                  rules={{
                    required: true,
                  }}
                  render={({ field }) => (
                    <Input
                      placeholder="Username"
                      autoFocus
                      hasError={!!errors.username}
                      {...field}
                    />
                  )}
                />

                <p className="mt-[10px] text-grey text-[10px] mb-[30px]">
                  By signing up, you agree to our{" "}
                  <a
                    href="https://www.google.com"
                    className="text-primary underline"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://www.google.com"
                    className="text-primary underline"
                  >
                    Privacy Policy
                  </a>{" "}
                  and to receive periodic updates.
                </p>
                <Button
                  text="Sign up with Wallet"
                  fullWidth
                  type="submit"
                  bordered
                  textColor="dark"
                  className="text-[14.48px] font-medium text-black"
                  background="transparent"
                />
              </form>
              <div className="mt-[69px]">
                <BackButton />
              </div>
            </div>
            <p className="text-center text-white text-[15px] mt-8">
              Already have an account?{" "}
              <Link
                className="text-[15px] text-primary underline"
                to={PageRoutes.SIGN_IN_WITH_EMAIL}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
