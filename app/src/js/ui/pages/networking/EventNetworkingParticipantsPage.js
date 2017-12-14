/**
 * @requires ../asyncPage.js
 */
const EventNetworkingParticipantsPage = asyncPage({
	constructPage({event_id}) {
		
		return {
			profiles: new EventNetworkingProfilesCollection(event_id),
			profiles_fields: new Fields('request', 'outgoing_request')
		}
	},
	
	fetchData() {
		
		return this.props.profiles.fetch(this.props.profiles_fields, 20);
	},
	
	pageTitle: 'Аудитория события',
	
	headerTabs() {
		
		return [
			{title: 'Участники', page: `/event/${this.props.event_id}/networking/participants`},
			{title: 'Заявки', page: `/event/${this.props.event_id}/networking/requests`},
			{title: 'Контакты', page: `/event/${this.props.event_id}/networking/contacts`},
			{title: 'Мой профиль', page: `/event/${this.props.event_id}/networking/profile`},
		];
	}
}, class EventNetworkingParticipantsPage extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			current_modal: null,
			modal_props: null
		};
		
		this.hideModal = this.hideModal.bind(this);
	}
	
	hideModal() {
		this.setState({
			current_modal: null,
			modal_props: null
		});
	}
	
	render() {
		const CurrentModal = this.state.current_modal;
		
		return contentWrap(
			<div className="event_networking_page material -level_2_material">
				<header className="event_networking_header -hidden">
					<input className="event_networking_search form_input -rounded" placeholder="Поиск участников" />
				</header>
				<div className="event_networking_body">
					{this.props.profiles.map(profile => (
						<EventNetworkingPage.NetworkingProfileUnit key={profile.user_id} profile={profile} >
							{profile.info && <p><b>Полезен:</b> {profile.info}</p>}
							{profile.looking_for && <p><b>Ищет:</b> {profile.looking_for}</p>}
							{
								profile.outgoing_request.uuid ?
								isVoid(profile.outgoing_request.accept_status) ?
								<span className={__C.CLASSES.TEXT_COLORS.MUTED_50}>Заявка отправлена</span> :
								profile.outgoing_request.accept_status ?
								<span className={__C.CLASSES.TEXT_COLORS.FRANKLIN}>Заявка принята</span> :
								<span className={__C.CLASSES.TEXT_COLORS.ACCENT}>Заявка отклонена</span> : (
									<Action
										onClick={e => {
											this.setState({
												current_modal: CreateNetworkingRequestModal,
												modal_props: {profile}
											});
										}}
									>
										Отправить заявку
									</Action>
								)
							}
						</EventNetworkingPage.NetworkingProfileUnit>
					))}
				</div>
				{CurrentModal && <CurrentModal {...this.state.modal_props} hideModalHandler={this.hideModal} />}
			</div>
		);
	}
});