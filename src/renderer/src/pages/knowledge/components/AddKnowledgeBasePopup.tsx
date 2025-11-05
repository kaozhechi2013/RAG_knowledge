import { loggerService } from "@logger";
import { TopView } from "@renderer/components/TopView";
import { useKnowledgeBases } from "@renderer/hooks/useKnowledge";
import { useKnowledgeBaseForm } from "@renderer/hooks/useKnowledgeBaseForm";
import { getKnowledgeBaseParams } from "@renderer/services/KnowledgeService";
import type { KnowledgeBase } from "@renderer/types";
import { formatErrorMessage } from "@renderer/utils/error";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	AdvancedSettingsPanel,
	GeneralSettingsPanel,
	KnowledgeBaseFormModal,
	type PanelConfig,
} from "./KnowledgeSettings";

const logger = loggerService.withContext("AddKnowledgeBasePopup");

interface ShowParams {
	title: string;
}

interface PopupContainerProps extends ShowParams {
	resolve: (data: any) => void;
}

const PopupContainer: React.FC<PopupContainerProps> = ({ title, resolve }) => {
	const [open, setOpen] = useState(true);
	const { t } = useTranslation();
	const { addKnowledgeBase } = useKnowledgeBases();
	const {
		newBase,
		setNewBase,
		handlers,
		providerData: { selectedDocPreprocessProvider, docPreprocessSelectOptions },
	} = useKnowledgeBaseForm();

	const onOk = async () => {
		console.log("[DEBUG onOk] newBase.name:", newBase.name);
		console.log(
			"[DEBUG onOk] newBase.model:",
			newBase.model
				? JSON.stringify({
						id: newBase.model.id,
						name: newBase.model.name,
						provider: newBase.model.provider,
					})
				: "NULL",
		);

		if (!newBase.name?.trim()) {
			window.toast.error(t("knowledge.name_required"));
			return;
		}

		if (!newBase.model) {
			console.error("[ERROR] Model is null at validation check!");
			window.toast.error(t("knowledge.embedding_model_required"));
			return;
		}

		console.log("[DEBUG] Validation passed, proceeding with creation...");

		try {
			const _newBase: KnowledgeBase = {
				...newBase,
				created_at: Date.now(),
				updated_at: Date.now(),
			};

			console.log("[DEBUG] _newBase before API call:", {
				id: _newBase.id,
				name: _newBase.name,
				model: _newBase.model
					? {
							id: _newBase.model.id,
							name: _newBase.model.name,
							provider: _newBase.model.provider,
						}
					: null,
			});

			await window.api.knowledgeBase.create(getKnowledgeBaseParams(_newBase));

			console.log("[DEBUG] API call completed, adding to Redux...");
			addKnowledgeBase(_newBase);
			console.log("[DEBUG] Added to Redux");

			setOpen(false);
			resolve(_newBase);
		} catch (error) {
			logger.error("KnowledgeBase creation failed:", error as Error);
			window.toast.error(
				t("knowledge.error.failed_to_create") + formatErrorMessage(error),
			);
		}
	};

	const onCancel = () => {
		setOpen(false);
		resolve(null);
	};

	const panelConfigs: PanelConfig[] = [
		{
			key: "general",
			label: t("settings.general.label"),
			panel: (
				<GeneralSettingsPanel
					newBase={newBase}
					setNewBase={setNewBase}
					selectedDocPreprocessProvider={selectedDocPreprocessProvider}
					docPreprocessSelectOptions={docPreprocessSelectOptions}
					handlers={handlers}
				/>
			),
		},
		{
			key: "advanced",
			label: t("settings.advanced.title"),
			panel: <AdvancedSettingsPanel newBase={newBase} handlers={handlers} />,
		},
	];

	return (
		<KnowledgeBaseFormModal
			title={title}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			panels={panelConfigs}
		/>
	);
};

export default class AddKnowledgeBasePopup {
	static TopViewKey = "AddKnowledgeBasePopup";

	static hide() {
		TopView.hide(AddKnowledgeBasePopup.TopViewKey);
	}

	static show(props: ShowParams) {
		return new Promise<any>((resolve) => {
			TopView.show(
				<PopupContainer
					{...props}
					resolve={(v) => {
						resolve(v);
						AddKnowledgeBasePopup.hide();
					}}
				/>,
				AddKnowledgeBasePopup.TopViewKey,
			);
		});
	}
}
