const Main = imports.ui.main;
const { overview } = Main;


class Extension {
    constructor() {
    }

    enable() {
		// this is so ridiculous...
		this.toggleOverview = overview.toggle;
		overview.toggle = () => {
			const isOpening = !overview.visible;
			this.toggleOverview.call(overview);
			if (isOpening) {
				const asdf = Main.layoutManager.overviewGroup
					.get_children()[1]
					.get_children()[0]
					.get_children()[5]
					.get_children()[0]
					.get_children()[0];
				asdf.remove_child(
					asdf.get_children()[0]
				);
			}
		};
    }

    disable() {
		overview.toggle = this.toggleOverview;
    }
}

function init() {
    return new Extension();
}
