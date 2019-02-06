import React, { Component } from 'react'
import get from 'lodash/get'
import queryString from 'query-string'

import listingSchemaMetadata from 'utils/listingSchemaMetadata.js'

import withConfig from 'hoc/withConfig'
import Dropdown from 'components/Dropdown'

class Search extends Component {
  constructor(props) {
    super(props)

    this.listingTypes = [
      listingSchemaMetadata.listingTypeAll,
      ...listingSchemaMetadata.listingTypes
    ]

    const getParams = queryString.parse(get(this.props, 'location.search', ''))

    let listingType = listingSchemaMetadata.listingTypeAll
    if (getParams.listing_type !== undefined) {
      listingType =
        this.listingTypes.find(
          listingTypeItem => listingTypeItem.type === getParams.listing_type
        ) || listingType
    }

    this.state = {
      searchInput: props.value || '',
      category: 'All',
      selectedListingType: listingType,
      searchInput: getParams.search_query || ''
    }
  }


  render() {
    const enabled = get(this.props, 'config.discovery', false)
    return (
      <div className="search-bar">
        <div className="container">
          <div className="input-group">
            <Dropdown
              className="input-group-prepend"
              content={
                <SearchDropdown
                  onChange={category =>
                    this.setState({ category, open: false })
                  }
                />
              }
              open={this.state.open}
              onClose={() => this.setState({ open: false })}
            >
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                onClick={() =>
                  this.setState({ open: this.state.open ? false : true })
                }
                children={this.state.category}
              />
            </Dropdown>
            <input
              type="text"
              className="form-control"
              placeholder={enabled ? null : 'Note: Search unavailable'}
              value={this.state.searchInput}
              onChange={e => this.setState({ searchInput: e.target.value })}
              onKeyUp={e => {
                if (e.keyCode === 13) this.doSearch()
              }}
            />
            <div className="input-group-append">
              <button
                className="btn btn-primary"
                onClick={() => this.doSearch()}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  doSearch() {
    document.location.href = `#/search?search_query=${
      this.state.searchInput
    }&listing_type=${this.state.selectedListingType.type}`

    if (this.props.onSearch) {
      this.props.onSearch(this.state.searchInput)
    }
  }
}

const categories = ['All', 'For Sale', 'For Rent', 'Services', 'Announcements']
const SearchDropdown = ({ onChange }) => (
  <div className="dropdown-menu show">
    {categories.map((cat, idx) => (
      <a
        key={idx}
        className="dropdown-item"
        href="#"
        onClick={() => onChange(cat)}
      >
        {cat}
      </a>
    ))}
  </div>
)

export default withConfig(Search)

require('react-styl')(`
  .search-bar
    padding: 0.7rem 0
    box-shadow: 0 1px 0 0 var(--light)
    background-color: var(--pale-grey)
    .input-group
      max-width: 520px
    .btn-outline-secondary
      border: 1px solid var(--light)
      font-size: 14px
      font-weight: normal
      color: var(--dusk)
    .dropdown-toggle::after
      margin-left: 0.5rem
    .form-control
      border-color: var(--light)
      &::placeholder
        opacity: 0.5
    .btn-primary
      background: var(--dusk) url(images/magnifying-glass.svg) no-repeat center
      border-color: var(--dusk)
      padding-left: 1.25rem
      padding-right: 1.25rem
`)
