const Main = imports.ui.main;
const { overview } = Main;
const { Clutter/* , St */ } = imports.gi;

const Overview = imports.ui.overview;
const { Workspace } = imports.ui.workspace;
const isOverviewWindow = Workspace.prototype._isOverviewWindow;


class Extension {
    constructor() {
		// just make it linear. the combination of multiple non-linear easing
		// functions results in wonky animations
		Clutter.AnimationMode.EASE_OUT_QUAD = Clutter.AnimationMode.LINEAR;
		// make it slightly faster
		Overview.ANIMATION_TIME = 200;
    }

	handleShowing() {
		// remove desktop
		const asdf = Main.layoutManager.overviewGroup
			.get_children()[1]
			.get_children()[0]
			.get_children()[5]
			.get_children()[0]
			.get_children()[0];

		// global.log(asdf);
		// [0x555a7bca5e30 Gjs_ui_workspace_Workspace.window-picker:insensitive ("Calendar")]

		asdf.remove_child(
			asdf.get_children()[0]
		);

		const WINDOW_OVERLAY_FADE_TIME = 200;
		// const WINDOW_ACTIVE_SIZE_INC = 5;
		const qwer = asdf
			.get_children()[0]
			.get_children().forEach((child) => {
				// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/windowPreview.js
				// global.log(child);

				const children = child.get_children();
				const caption = children[1];
				const icon = children[2];
				// const closeButton = children[3];

				// caption.visible = true;
				caption.show();
				caption.translation_y = -10;
				icon.translation_y = -5;

				// override https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/windowPreview.js#L301
				child.showOverlay = (animate) => {
					if (!child._overlayEnabled)
						return;

					if (child._overlayShown)
						return;

					child.add_style_class_name('add-outline');

					child._overlayShown = true;
					child._restack();

					// If we're supposed to animate and an animation in our direction
					// is already happening, let that one continue
					const ongoingTransition = child._title.get_transition('opacity');
					if (animate &&
						ongoingTransition &&
						ongoingTransition.get_interval().peek_final_value() === 255)
						return;

					const toShow = child._windowCanClose()
						? [/* child._title, */ child._closeButton]
						: [/* child._title */];

					toShow.forEach(a => {
						a.opacity = 0;
						a.show();
						a.ease({
							opacity: 255,
							duration: animate ? WINDOW_OVERLAY_FADE_TIME : 0,
							mode: Clutter.AnimationMode.EASE_OUT_QUAD,
						});
					});

					// const [width, height] = child.window_container.get_size();
					// const { scaleFactor } = St.ThemeContext.get_for_stage(global.stage);
					// const activeExtraSize = WINDOW_ACTIVE_SIZE_INC * 2 * scaleFactor;
					// const origSize = Math.max(width, height);
					// const scale = (origSize + activeExtraSize) / origSize;

					// child.window_container.ease({
					// 	scale_x: scale,
					// 	scale_y: scale,
					// 	duration: animate ? WINDOW_SCALE_TIME : 0,
					// 	mode: Clutter.AnimationMode.EASE_OUT_QUAD,
					// });

					child.emit('show-chrome');
				};

				child.hideOverlay = (animate) => {
					if (!child._overlayShown)
						return;

					child.remove_style_class_name('add-outline');

					child._overlayShown = false;
					child._restack();

					// If we're supposed to animate and an animation in our direction
					// is already happening, let that one continue
					const ongoingTransition = child._title.get_transition('opacity');
					if (animate &&
						ongoingTransition &&
						ongoingTransition.get_interval().peek_final_value() === 0)
						return;

					[
						// child._title,
						child._closeButton
					].forEach(a => {
						a.opacity = 255;
						a.ease({
							opacity: 0,
							duration: animate ? WINDOW_OVERLAY_FADE_TIME : 0,
							mode: Clutter.AnimationMode.EASE_OUT_QUAD,
							onComplete: () => a.hide(),
						});
					});

					// child.window_container.ease({
					// 	scale_x: 1,
					// 	scale_y: 1,
					// 	duration: animate ? WINDOW_SCALE_TIME : 0,
					// 	mode: Clutter.AnimationMode.EASE_OUT_QUAD,
					// });
				};
			});

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

		// exclude certain applications
		Workspace.prototype._isOverviewWindow = (win) => {
			// global.log(win.wm_class);
			if (win.wm_class === 'copyq') {
				return false;
			}
			return isOverviewWindow(win);
		};
    }

    disable() {
		// Main.overview.disconnect(this.handleHidingId);
		Main.overview.disconnect(this.handleHiddenId);
		Main.overview.disconnect(this.handleShowingId);
		// Main.overview.disconnect(this.handleShownId);

		Workspace.prototype._isOverviewWindow = isOverviewWindow;
    }
}

function init() {
    return new Extension();
}
