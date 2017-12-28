import React, { Component } from 'react'
import contractService from '../services/contract-service'
import ipfsService from '../services/ipfs-service'
import { Link } from 'react-router-dom'

class ListingCard extends Component {

  constructor(props) {
    super(props)
    this.state = {
      category: "Loading...",
      name: "Loading...",
      price: "Loading...",
      ipfsHash: null,
      lister: null,
      unitsAvailable: null
    }
  }

  componentWillMount() {
    contractService.getListing(this.props.listingId)
    .then((listingContractObject) => {
      this.setState(listingContractObject)
        ipfsService.getListing(this.state.ipfsHash)
        .then((listingJson) => {
          this.setState(JSON.parse(listingJson).data)
        })
        .catch((error) => {
          console.error(`Error fetching IPFS info for listingId: ${this.props.listingId}`)
        })
    })
    .catch((error) => {
      console.error(`Error fetching conract info for listingId: ${this.props.listingId}`)
    })
  }

  render() {

    return (
      <div className="col-12 col-md-6 col-lg-4 listing-card">
        <Link to={`/listing/${this.props.listingId}`}>
          <div className="photo">
            <img
              src={
                (this.state.pictures && this.state.pictures.length>0) ?
                this.state.pictures[0] :
                '/images/missing-image-placeholder.png'
              }
            />
          </div>
        </Link>
        <div className="category">{this.state.category}</div>
        <div className="title">{this.state.name}</div>
        <div className="price">
            {Number(this.state.price).toFixed(3)} ETH
            {this.state.unitsAvailable===0 &&
              <span className="sold-banner">SOLD</span>
            }
        </div>
      </div>
    )
  }
}

export default ListingCard
