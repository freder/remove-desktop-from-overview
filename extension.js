const Main = imports.ui.main;
const { overview } = Main;
const { Clutter, Shell } = imports.gi;

const Overview = imports.ui.overview;
const { Workspace } = imports.ui.workspace;
const isOverviewWindow = Workspace.prototype._isOverviewWindow;


const wmClassBlacklist = ['copyq'];


// TODO: doesn't seem to work as expected
function animationOverrides() {
	// just make it linear. the combination of multiple non-linear easing
	// functions results in wonky animations
	Clutter.AnimationMode.EASE_OUT_QUAD = Clutter.AnimationMode.LINEAR;
	// make it slightly faster
	Overview.ANIMATION_TIME = 200;
}


class Extension {
    constructor() {
		//
    }

	handleShowing() {
		animationOverrides()

		// remove desktop
		const workspaceElem = Main.layoutManager.overviewGroup
			.get_children()[1]
			.get_children()[0]
			.get_children()[5]
			.get_children()[0]
			.get_children()[0];
		workspaceElem.remove_child(
			workspaceElem.get_children()[0]
		);

		// get window previews
		// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/windowPreview.js
		const previews = workspaceElem
			.get_children()[0]
			.get_children();

		// in order for arrow key selection to work, a window needs to be
		// initially selected, it seems. if the mouse pointer happens to be
		// on a window preview when the overview opens that is the case.
		// if not, one has to move the mouse (which obviously is not what
		// we want in this situation).
		// this simply selects the active (fallback: last used) window, so
		// that we have initial focus.
		let focusWinTitle = null;
		if (global.display.focus_window) {
			const previewTitles = previews.map(
				(child) => child.metaWindow.title
			);
			const title = global.display.focus_window.title;
			// handles the case when active window is excluded from overview
			if (previewTitles.includes(title)) {
				focusWinTitle = title;
			}
		}
		if (focusWinTitle) {
			if (child.metaWindow.title === focusWinTitle) {
				global.stage.set_key_focus(child);
			}
		} else {
			// get the last used (= top-most?) window
			const apps = Shell.AppSystem.get_default().get_running();
			const firstWindows = apps.map(app => app.get_windows()[0])
				.filter((win) => !wmClassBlacklist.includes(win.wm_class))
			const w = firstWindows[0];
			for (let ii = 0; ii < previews.length; ii++) {
				const p = previews[ii];
				if (p.metaWindow.title === w.title) {
					global.stage.set_key_focus(p);
				}
			}
		}

		// customize individual window previews:
		previews.forEach((child, i) => {
				const children = child.get_children();
				const caption = children[1];
				const icon = children[2];
				// const closeButton = children[3];

				caption.show();

				// modify position slightly
				caption.translation_y = -10;
				icon.translation_y = -5;

				// method overrides:
				// - disable scale effect on hover
				// - instead: show outline
				// - make sure caption is always shown
				const WINDOW_OVERLAY_FADE_TIME = 70; // 200
				// const WINDOW_ACTIVE_SIZE_INC = 5;
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
		animationOverrides()
	}

	handleHidden() {
		// show panel again
		Main.panel.set_opacity(255);
		Main.layoutManager.panelBox.set_opacity(255);

		// show dash again
		Main.overview.dash.set_opacity(255);
	}

    enable() {
		this.handleHidingId = Main.overview.connect('hiding', this.handleHiding);
		this.handleHiddenId = Main.overview.connect('hidden', this.handleHidden);
		this.handleShowingId = Main.overview.connect('showing', this.handleShowing);
		this.handleShownId = Main.overview.connect('shown', this.handleShown);

		// exclude certain applications from overview:
		Workspace.prototype._isOverviewWindow = (win) => {
			if (wmClassBlacklist.includes(win.wm_class)) {
				return false;
			}
			return isOverviewWindow(win);
		};
    }

    disable() {
		Main.overview.disconnect(this.handleHidingId);
		Main.overview.disconnect(this.handleHiddenId);
		Main.overview.disconnect(this.handleShowingId);
		Main.overview.disconnect(this.handleShownId);

		Workspace.prototype._isOverviewWindow = isOverviewWindow;
    }
}

function init() {
    return new Extension();
}
