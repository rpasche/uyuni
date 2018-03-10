'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const Network = require('../utils/network');
const Messages = require('../components/messages').Messages;
const MessagesUtils = require("../components/messages").Utils;
const {DataHandler, DataItem, SearchField, Highlight} = require('../components/data-handler');
const Functions = require('../utils/functions');
const Utils = Functions.Utils;
const {ModalButton, ModalLink} = require("../components/dialogs");
const Button = require('../components/buttons').Button;
const SCCDialog = require('./products-scc-dialog').SCCDialog;
const PopUp = require("../components/popup").PopUp;
const ProgressBar = require("../components/progressbar").ProgressBar;
const CustomDiv = require("../components/custom-objects").CustomDiv;

const _DATA_ROOT_ID = 'baseProducts';

const _SETUP_WIZARD_STEPS = [
  {
    id: 'wizard-step-proxy',
    label: 'HTTP Proxy',
    url: '/rhn/admin/setup/ProxySettings.do',
    active: false
  },
  {
    id: 'wizard-step-credentials',
    label: 'Organization Credentials',
    url: '/rhn/admin/setup/MirrorCredentials.do',
    active: false
  },
  {
    id: 'wizard-step-suse-products',
    label: 'SUSE Products',
    url: location.href.split(/\?|#/)[0],
    active: true
  }
];

const _PRODUCT_STATUS = {
  installed: 'INSTALLED',
  available: 'AVAILABLE',
  unavailable: 'UNAVAILABLE'
};

const _CHANNEL_STATUS = {
  notSynced: 'NOT_MIRRORED',
  syncing: 'IN_PROGRESS',
  synced: 'FINISHED',
  failed: 'FAILED'
};

function reloadData() {
  return Network.get('/rhn/manager/api/admin/products', 'application/json').promise;
}

const ProductPageWrapper = React.createClass({
  getInitialState: function() {
    return {
      issMaster: issMaster_flag_from_backend,
      refreshNeeded: refreshNeeded_flag_from_backend,
      refreshRunning: refreshRunning_flag_from_backend,
      serverData: {_DATA_ROOT_ID : []},
      errors: [],
      loading: true,
      selectedItems: [],
      showPopUp: // trigger the refresh at the first page load if
        refreshNeeded_flag_from_backend &&
        issMaster_flag_from_backend &&
        !refreshRunning_flag_from_backend,
      syncRunning: false,
      addingProducts: false
    }
  },

  componentWillMount: function() {
    if (!this.state.refreshRunning) {
      this.refreshServerData();
    }
  },

  refreshServerData: function(dataUrlTag) {
    this.setState({loading: true});
    var currentObject = this;
    reloadData()
      .then(data => {
        currentObject.setState({
          serverData: data[_DATA_ROOT_ID],
          errors: [],
          loading: false
        });
      })
      .catch(this.handleResponseError);
  },

  handleSelectedItems: function(items) {
    this.setState({ selectedItems: items });
  },

  showPopUp: function() {
    this.setState({showPopUp: true});
  },

  closePopUp: function() {
    this.setState({showPopUp: false});
  },

  updateSyncRunning: function(syncStatus) {
    // if it was running and now it's finished
    if (this.state.syncRunning && !syncStatus) {
      this.refreshServerData(); // reload data
    }

    if (syncStatus) {
      this.setState({ errors: MessagesUtils.info(t('The product catalog refresh is running..')) });
    }
    this.setState({ syncRunning: syncStatus });
  },

  submit: function() {
    const currentObject = this;
    currentObject.setState({ addingProducts: true });
    Network.post(
        '/rhn/manager/admin/setup/products',
        JSON.stringify(currentObject.state.selectedItems), 'application/json'
    ).promise.then(data => {
      if(data) {
        currentObject.setState(
          {
            errors: MessagesUtils.success(data),
            selectedItems : [],
            addingProducts: false}
        );
      }
      else {
        currentObject.setState(
          {
            errors: MessagesUtils.warning(data),
            selectedItems : [],
            addingProducts: false}
        );
      }
    })
    .catch(currentObject.handleResponseError);
  },

  handleResponseError: function(jqXHR, arg = "") {
    const msg = Network.responseErrorMessage(jqXHR,
      (status, msg) => msgMap[msg] ? t(msgMap[msg], arg) : null);
    this.setState({ errors: this.state.errors.concat(msg) });
  },

  render: function() {
    const data = this.state.serverData;

    const title =
      <div className='spacewalk-toolbar-h1'>
        <h1>
          <i className='fa fa-cogs'></i>
          &nbsp;
          {t('Setup Wizard')}
          &nbsp;
          <a href='/rhn/help/reference/en-US/ref.webui.admin.jsp#ref.webui.admin.wizard'
              target='_blank'><i className='fa fa-question-circle spacewalk-help-link'></i>
          </a>
        </h1>
      </div>
    ;

    const tabs = 
      <div className='spacewalk-content-nav'>
        <ul className='nav nav-tabs'>
          { _SETUP_WIZARD_STEPS.map(step => <li key={step.id} className={step.active ? 'active' : ''}><a href={step.url}>{t(step.label)}</a></li>)}
        </ul>
      </div>;

    let pageContent;
    if (this.state.refreshRunning) {
      pageContent = (
        <div className='alert alert-warning' role='alert'>
          {t('A refresh of the product data is currently running in the background. Please try again later.')}
        </div>
      );
    }
    else if (this.state.issMaster) {

      const submitButtonTitle =
        this.state.syncRunning ?
          t('The product catalog is still refreshing, please wait.')
          : this.state.selectedItems.length == 0 ?
              t('Select some product first.')
              : null;
      const addProductButton = (
        this.state.syncRunning || this.state.selectedItems.length == 0 || this.state.addingProducts ?
        <Button
            id="addProducts"
            icon={this.state.addingProducts ? 'fa-plus-circle fa-spin' : 'fa-plus'}
            className='btn-default text-muted'
            title={submitButtonTitle}
            text={t('Add products')}
        />
        :
        <Button
            id="addProducts"
            icon="fa-plus"
            className={'btn-success'}
            text={t('Add products') + (this.state.selectedItems.length > 0 ? ' (' + this.state.selectedItems.length + ')' : '')}
            handler={this.submit}
        />
      );
      pageContent = (
        <div className='row' id='suse-products'>
          <div className='col-sm-9'>
            <Messages items={this.state.errors}/>
            <div>
              <div className='spacewalk-section-toolbar'>
                <div className='action-button-wrapper'>
                  <div className='btn-group'>
                    <ModalButton
                        className='btn btn-default'
                        id='sccRefresh'
                        icon={'fa-refresh ' + (this.state.syncRunning ? 'fa-spin' : '')}
                        title={
                          this.state.syncRunning ?
                            t('The product catalog refresh is running..')
                            : t('Refreshes the product catalog from the Customer Center')
                        }
                        text={t('Refresh')}
                        target='scc-refresh-popup'
                        onClick={() => this.showPopUp()}
                    />
                    {addProductButton}
                  </div>
                </div>
              </div>
              <Products
                  data={this.state.serverData}
                  loading={this.state.loading}
                  handleSelectedItems={this.handleSelectedItems}
                  selectedItems={this.state.selectedItems}
              />
            </div>
          </div>
          <div className='col-sm-3 hidden-xs' id='wizard-faq'>
              <h4>{t("Why aren't all SUSE products displayed in the list?")}</h4>
              <p>{t('The products displayed on this list are directly linked to your \
                  Organization credentials (Mirror credentials) as well as your SUSE subscriptions.')}</p>
              <p>{t('If you believe there are products missing, make sure you have added the correct \
                  Organization credentials in the previous wizard step.')}</p>
          </div>
        </div>
      );
    }
    else {
      pageContent = (
        <div className='alert alert-warning' role='alert'>
          {t('This server is configured as an Inter-Server Synchronisation (ISS) slave. SUSE Products can only be managed on the ISS master.')}
        </div>
      );
    }

    const prevStyle = { 'marginLeft': '10px' , 'verticalAlign': 'middle'};
    const currentStepIndex = _SETUP_WIZARD_STEPS.indexOf(_SETUP_WIZARD_STEPS.find(step => step.active));
    const footer =
      <div className='panel-footer'>
        <div className='btn-group'>  
          {
            currentStepIndex > 1 ?
              <a className='btn btn-default' href={_SETUP_WIZARD_STEPS[currentStepIndex-1].url}>
                <i className='fa fa-arrow-left'></i>{t('Prev')}
              </a> : null
          }
          {
            currentStepIndex < (_SETUP_WIZARD_STEPS.length - 1) ?
              <a className='btn btn-success' href={_SETUP_WIZARD_STEPS[currentStepIndex+1].url}>
                <i className='fa fa-arrow-right'></i>{t('Next')}
              </a> : null
          }
        </div>
        <span style={prevStyle}>
          { currentStepIndex+1 }&nbsp;{t('of')}&nbsp;{ _SETUP_WIZARD_STEPS.length }
        </span>
      </div>;

    return (
      <div className='responsive-wizard'>
        {title}
        {tabs}
        <div className='panel panel-default' id='products-content'>
            <div className='panel-body'>
              {pageContent}
            </div>
        </div>
        <SCCDialog
            onClose={() => this.closePopUp}
            start={this.state.showPopUp && !this.state.syncRunning}
            updateSyncRunning={(syncStatus) => this.updateSyncRunning(syncStatus)}
          />
        {footer}
      </div>
    )
  }
});

const Products = React.createClass({
  getInitialState: function() {
    return {
      popupItem: null
    }
  },

  handleSelectedItem: function(id) {
    let arr = this.props.selectedItems;
    if(arr.includes(id)) {
      arr = arr.filter(i => i !== id);
    } else {
      arr = arr.concat([id]);
    }
    this.props.handleSelectedItems(arr);
  },

  searchData: function(datum, criteria) {
    if (criteria) {
      return (datum.label).toLowerCase().includes(criteria.toLowerCase());
    }
    return true;
  },

  buildRows: function(message) {
    return Object.keys(message).map((id) => message[id]);
  },

  showChannelsfor: function(item) {
    this.setState({popupItem: item});
  },

  render: function() {
    const titlePopup = t('Product Channels - ') + (this.state.popupItem != null ? this.state.popupItem['label'] : '');
    const contentPopup = 
      this.state.popupItem != null ?
        (
          <div>
            {
              this.state.popupItem['channels'].filter(c => !c.optional).length > 0 ?
                <div>
                  <h4>Mandatory Channels</h4>
                  <ul className='product-channel-list'>
                    {
                      this.state.popupItem['channels']
                        .filter(c => !c.optional)
                        .map(c => <li>{c.summary}&nbsp;<small>[{c.label}]</small></li>)
                    }
                  </ul>
                </div>
                : null
            }
            {
              this.state.popupItem['channels'].filter(c => c.optional).length > 0 ?
                <div>
                  <h4>Optional Channels</h4>
                  <ul className='product-channel-list'>
                    {
                      this.state.popupItem['channels']
                        .filter(c => c.optional)
                        .map(c => <li>{c.summary}&nbsp;<small>[{c.label}]</small></li>)
                    }
                  </ul>
                </div>
                : null
            }
          </div>
        )
      : null ;
    return (
      <div>
        <DataHandler
          data={this.buildRows(this.props.data)}
          identifier={(raw) => raw['identifier']}
          initialItemsPerPage={userPrefPageSize}
          loading={this.props.loading}
          searchField={
              <SearchField filter={this.searchData}
                  criteria={''}
                  placeholder={t('Filter by product name')} />
          }>
          <CheckList data={d => d}
              nestedKey='extensions'
              isSelectable={true}
              handleSelectedItem={this.handleSelectedItem}
              selectedItems={this.props.selectedItems}
              listStyleClass='product-list'
              isFirstLevel={true}
              showChannelsfor={this.showChannelsfor}
          />
        </DataHandler>
        <PopUp
            id='show-channels-popup'
            title={titlePopup}
            content={contentPopup}
            className='modal-xs'
        />
      </div>
    )
  }
});

const CheckList = React.createClass({
  handleSelectedItem: function(id) {
    this.props.handleSelectedItem(id);
  },

  render: function() {
    return (
      this.props.data ?
        <ul className={this.props.listStyleClass}>
          {
            this.props.data.map((l, index) =>
            {
              return (
                <CheckListItem item={l}
                    handleSelectedItem={this.handleSelectedItem}
                    selectedItems={this.props.selectedItems}
                    nestedKey={this.props.nestedKey}
                    isSelectable={true}
                    isFirstLevel={this.props.isFirstLevel}
                    index={index}
                    showChannelsfor={this.props.showChannelsfor}
                    listStyleClass={this.props.listStyleClass}
                />
              )
            })
          }
        </ul>
        : null
    )
  }
});

const CheckListItem = React.createClass({
  getInitialState: function() {
    return {
      itemsWithSublistVisible: []
    }
  },

  isSelected: function() {
    return this.props.selectedItems.includes(this.props.item['identifier']);
  },

  isSublistVisible: function() {
    return this.state.itemsWithSublistVisible.includes(this.props.item['identifier']);
  },

  handleSubListVisibility: function(id) {
    let arr = this.state.itemsWithSublistVisible;
    if(arr.includes(id)) {
      arr = arr.filter(i => i !== id);
    } else {
      arr = arr.concat([id]);
    }
    this.setState({itemsWithSublistVisible: arr});
  },

  handleSelectedItem: function(id) {
    this.props.handleSelectedItem(id);
  },

  getNestedData: function() {
    if (this.props.item &&
        this.props.nestedKey &&
        this.props.item[this.props.nestedKey] != null) {
     return this.props.item[this.props.nestedKey];
    }
    return [];
  },

  render: function() {
    /** generate item selector content **/
    const selectorContent =
      this.props.isSelectable && this.props.item.status == _PRODUCT_STATUS.available ?
        <input type='checkbox'
            value={this.props.item['identifier']}
            onChange={() => this.handleSelectedItem(this.props.item['identifier'])}
            checked={this.isSelected() ? 'checked' : ''}
        />
        : null;
    /*****/

    /** generate show nested list icon **/
    let showNestedDataIconContent;
    if (this.getNestedData().length > 0) {
      const openSubListIconClass = this.isSublistVisible() ? 'fa-caret-down' : 'fa-caret-right';
      showNestedDataIconContent = <i className={'fa ' + openSubListIconClass + ' fa-1-5x pointer'}
          onClick={() => this.handleSubListVisibility(this.props.item['identifier'])} />;
    }
    /*****/

    /** generate channel sync progress bar **/
    let channelSyncContent;
    if (this.props.item.status == _PRODUCT_STATUS.installed) {
      const mandatoryChannelList = this.props.item['channels'].filter(c => !c.optional);

      // if any failed sync channel, show the error only
      if (mandatoryChannelList.filter(c => c.status == _CHANNEL_STATUS.failed).length > 0) {
        channelSyncContent = <span className="text-danged">{t('Sync failed')}</span>;
      }
      else {
        const syncedChannels = mandatoryChannelList.filter(c => c.status == _CHANNEL_STATUS.synced).length;
        const toBeSyncedChannels = mandatoryChannelList.length;
        const channelSyncProgress = Math.round(( syncedChannels / toBeSyncedChannels ) * 100);
        channelSyncContent = <ProgressBar progress={channelSyncProgress} title={t('Product sync status')} />;
      }
    }
    /*****/

    /** generate product resync button **/
    const resyncButtonContent =
      this.props.item.status == _PRODUCT_STATUS.installed ?
        <Button className='btn-default btn-sm' icon='fa-refresh' disabled title={t('Resync product')} />
        : null;
    /*****/

    let evenOddClass = (this.props.index % 2) === 0 ? "list-row-even" : "list-row-odd";

    return (
      <li className={evenOddClass} key={this.props.item['identifier']}>
        <CustomDiv className='col text-center' width={30} um='px'>{selectorContent}</CustomDiv>
        <CustomDiv className='col text-center' width={20} um='px'>{showNestedDataIconContent}</CustomDiv>
        <CustomDiv className='col col-class-calc-width'>{this.props.item['label']}</CustomDiv>
        <CustomDiv className='col' width={50} um='px' title={t('Architecture')}>{this.props.isFirstLevel ? this.props.item['arch'] : ''}</CustomDiv>
        <CustomDiv className='col text-center' width={35} um='px'>
          <ModalLink
              id='showChannels'
              icon='fa-list'
              title={t('Show product\'s channels')}
              target='show-channels-popup'
              onClick={() => this.props.showChannelsfor(this.props.item)}
          />
        </CustomDiv>
        <CustomDiv className='col text-center' width={110} um='px'>{channelSyncContent}</CustomDiv>
        <CustomDiv className='col text-center' width={45} um='px'>{resyncButtonContent}</CustomDiv>
        { this.isSublistVisible() ?
          <CheckList data={this.getNestedData()}
              nestedKey={this.props.nestedKey}
              isSelectable={this.props.isSelectable}
              selectedItems={this.props.selectedItems}
              handleSelectedItem={this.handleSelectedItem}
              listStyleClass={this.props.listStyleClass}
              isFirstLevel={false}
              showChannelsfor={this.props.showChannelsfor}
          />
          : null }
      </li>
    )
  }
});

ReactDOM.render(
  <ProductPageWrapper />,
  document.getElementById('products')
);
