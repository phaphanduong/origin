import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

// Note that this is NOT the same as this file. This `CreateListing`
// is under `origin-dapp/src/mutations`
import CreateListingMutation from 'mutations/CreateListing'
import SignMessageMutation from 'mutations/SignMessage'
import CreateListingWithProxyMutation from 'mutations/CreateListingWithProxy'
import StoreToIPFSMutation from 'mutations/StoreToIPFS'

import TransactionError from 'components/TransactionError'
import WaitForTransaction from 'components/WaitForTransaction'
import Redirect from 'components/Redirect'

import withCanTransact from 'hoc/withCanTransact'
import withWallet from 'hoc/withWallet'
import withWeb3 from 'hoc/withWeb3'

import Store from 'utils/store'
const store = Store('sessionStorage')

import applyListingData from './_listingData'

class CreateListing extends Component {
  state = {}
  render() {
    if (this.state.redirect) {
      return <Redirect to={this.state.redirect} push />
    }
    if (this.props.cannotTransact === 'no-balance') {
      return this.renderCreateListingWithProxy()
    }

    return this.renderCreateListing()
  }

  onClick(createListing) {
    if (this.props.cannotTransact) {
      this.setState({
        error: this.props.cannotTransact,
        errorData: this.props.cannotTransactData
      })
      return
    }

    this.setState({ waitFor: 'pending' })

    const { listing, tokenBalance, wallet } = this.props

    const variables = applyListingData(this.props, {
      deposit: tokenBalance >= Number(listing.boost) ? listing.boost : '0',
      depositManager: wallet,
      from: wallet
    })

    createListing({ variables })
  }

  renderWaitModal() {
    if (!this.state.waitFor) return null
    const netId = get(this.props, 'web3.networkId')

    return (
      <WaitForTransaction
        hash={this.state.waitFor}
        event="ListingCreated"
        onClose={() => this.setState({ waitFor: null })}
      >
        {({ event }) => (
          <div className="make-offer-modal success">
            <div className="success-icon" />
            <fbt desc="createListing.success">
              <div>Your listing has been created!</div>
              <div>
                Your listing will be visible within a few seconds. Here&apos;s
                what happens next:
                <ul>
                  <li>Buyers will now see your listing on the marketplace.</li>
                  <li>
                    When a buyer makes an offer on your listing, you can choose
                    to accept or reject it.
                  </li>
                  <li>
                    Once the offer is accepted, you will be expected to fulfill
                    the order.
                  </li>
                  <li>
                    You will receive payment once the buyer confirms that the
                    order has been fulfilled.
                  </li>
                </ul>
              </div>
            </fbt>
            <button
              href="#"
              className="btn btn-outline-light"
              onClick={() => {
                store.set('create-listing', undefined)
                const { listingID } = event.returnValues
                this.setState({
                  redirect: `/listing/${netId}-000-${listingID}`
                })
              }}
              children={fbt('View Listing', 'View Listing')}
            />
          </div>
        )}
      </WaitForTransaction>
    )
  }

  renderCreateListing() {
    return (
      <Mutation
        mutation={CreateListingMutation}
        onCompleted={({ createListing }) => {
          this.setState({ waitFor: createListing.id })
        }}
        onError={errorData =>
          this.setState({ waitFor: false, error: 'mutation', errorData })
        }
      >
        {createListing => (
          <>
            <button
              className={this.props.className}
              onClick={() => this.onClick(createListing)}
              children={this.props.children}
            />
            {this.renderWaitModal()}
            {this.state.error && (
              <TransactionError
                reason={this.state.error}
                data={this.state.errorData}
                onClose={() => this.setState({ error: false })}
              />
            )}
          </>
        )}
      </Mutation>
    )
  }

  storeToIPFS(storeToIPFS) {
    this.setState({ waitFor: 'pending' })

    const { listing, tokenBalance, wallet } = this.props

    const variables = applyListingData(this.props, {
      deposit: tokenBalance >= Number(listing.boost) ? listing.boost : '0',
      depositManager: wallet,
      from: wallet
    })

    storeToIPFS({
      variables
    })
  }

  signMessage(signMessage, { txData, dataToSign }) {
    const { wallet } = this.props

    this.setState({
      proxyData: {
        // ipfsHash,
        txData
        // dataToSign
      }
    })

    signMessage({
      variables: {
        address: wallet,
        message: dataToSign
      }
    })
  }

  createListingWithProxy(createListingWithProxy, sign) {
    const { txData } = this.state.proxyData
    const { wallet } = this.props

    createListingWithProxy({
      variables: {
        txData,
        sign,
        signer: wallet
      }
    })
  }

  onListingCreated({ success, reason, data }) {
    if (success) {
      // const { proxyAddress, txHash } = JSON.parse(data)
      // Where to show proxy addrss and tx hash??
      this.setState({ error: false, waitFor: 'proxy-creation' })
      return
    }

    this.setState({
      error: reason,
      errorData: JSON.parse(data),
      waitFor: false
    })
  }

  renderCreateListingWithProxy() {
    return (
      <Mutation
        mutation={CreateListingWithProxyMutation}
        onCompleted={({ createListingWithProxy }) =>
          this.onListingCreated(createListingWithProxy)
        }
        onError={errorData =>
          this.setState({ waitFor: false, error: 'mutation', errorData })
        }
      >
        {createListingWithProxy => (
          <Mutation
            mutation={SignMessageMutation}
            onCompleted={({ signMessage }) =>
              this.createListingWithProxy(createListingWithProxy, signMessage)
            }
            onError={errorData =>
              this.setState({ waitFor: false, error: 'mutation', errorData })
            }
          >
            {signMessage => (
              <Mutation
                mutation={StoreToIPFSMutation}
                onCompleted={({ storeToIPFS }) =>
                  this.signMessage(signMessage, storeToIPFS)
                }
                onError={errorData =>
                  this.setState({
                    waitFor: false,
                    error: 'mutation',
                    errorData
                  })
                }
              >
                {storeToIPFS => (
                  <>
                    <button
                      className={this.props.className}
                      onClick={() => {
                        this.setState({
                          error: this.props.cannotTransact,
                          errorData: this.props.cannotTransactData
                        })
                      }}
                      children={this.props.children}
                    />
                    {this.renderWaitModal()}
                    {this.state.error && (
                      <TransactionError
                        canCreateProxy={this.state.error === 'no-balance'}
                        reason={this.state.error}
                        data={this.state.errorData}
                        onClose={() => this.setState({ error: false })}
                        onCreateProxy={() => this.storeToIPFS(storeToIPFS)}
                      />
                    )}
                  </>
                )}
              </Mutation>
            )}
          </Mutation>
        )}
      </Mutation>
    )
  }
}

export default withWeb3(withWallet(withCanTransact(CreateListing)))
