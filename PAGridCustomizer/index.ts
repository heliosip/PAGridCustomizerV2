import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { cellRendererOverrides } from "./customizers/CellRendererOverrides";
import { cellEditorOverrides } from "./customizers/CellEditorOverrides";
import { PAOneGridCustomizer } from "./types";
import * as React from "react";

export class PAGridCustomizer implements ComponentFramework.ReactControl<IInputs, IOutputs> {

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        const eventName = context.parameters.EventName?.raw;
        
        console.log("PAGridCustomizer initialized with image hover zoom functionality");
        console.log("EventName:", eventName);
        
        if (eventName) {
            const paOneGridCustomizer: PAOneGridCustomizer = { cellRendererOverrides, cellEditorOverrides };
            // Using a more specific type for the factory
            interface CustomFactory {
                factory: {
                    fireEvent: (eventName: string, customizer: PAOneGridCustomizer) => void;
                }
            }
            
            // Check if the context has the expected factory structure
            const customContext = context as unknown as CustomFactory;
            if (customContext.factory && typeof customContext.factory.fireEvent === 'function') {
                customContext.factory.fireEvent(eventName, paOneGridCustomizer);
            } else {
                console.error('fireEvent method not available on factory');
            }
        }
    }


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        return React.createElement(React.Fragment);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
