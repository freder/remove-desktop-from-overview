const Main = imports.ui.main;
const { overview } = Main;


class Extension {
    constructor() {
		//
    }

	handleShowing() {
		// remove desktop
		const asdf = Main.layoutManager.overviewGroup
			.get_children()[1]
			.get_children()[0]
			.get_children()[5]
			.get_children()[0]
			.get_children()[0];
		asdf.remove_child(
			asdf.get_children()[0]
		);

		// hide panel
		Main.panel.set_opacity(0);
		Main.layoutManager.panelBox.set_opacity(0);

		// hide dash
		Main.overview.dash.set_opacity(0);
	}

	handleShown() {
		//
	}

	handleHiding() {
		//
	}

	handleHidden() {
		// show panel again
		Main.panel.set_opacity(255);
		Main.layoutManager.panelBox.set_opacity(255);

		// show dash again
		Main.overview.dash.set_opacity(255);
	}

    enable() {
		// this.handleHidingId = Main.overview.connect('hiding', this.handleHiding);
		this.handleHiddenId = Main.overview.connect('hidden', this.handleHidden);
		this.handleShowingId = Main.overview.connect('showing', this.handleShowing);
		// this.handleShownId = Main.overview.connect('shown', this.handleShown);
    }

    disable() {
		// Main.overview.disconnect(this.handleHidingId);
		Main.overview.disconnect(this.handleHiddenId);
		Main.overview.disconnect(this.handleShowingId);
		// Main.overview.disconnect(this.handleShownId);
    }
}

function init() {
    return new Extension();
}
