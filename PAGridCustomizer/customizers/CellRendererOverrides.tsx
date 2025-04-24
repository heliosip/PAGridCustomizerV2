import { Label } from '@fluentui/react';
import * as React from 'react';
import { CellRendererOverrides, RECID } from '../types';
import { ImageWithZoom } from '../components/ImageWithZoom';

export const cellRendererOverrides: CellRendererOverrides = {
    // Override for URL type columns - specifically for image URLs
    ["URL"]: (props, col) => {
        if (col.colDefs[col.columnIndex].name === 'hip_imageurl') {
            if(!props.formattedValue || props.formattedValue === ""){
                return <div 
                    style={{ textAlign: 'center'}}>
                        <img 
                            style={{ objectFit: 'contain' }} 
                            src={"hip_no_image_available"} 
                            height={42} 
                            width={42}/>
                    </div>
            } else {
                return <div 
                    style={{ textAlign: 'center', margin: '3.5px'}}>
                        <ImageWithZoom 
                            src={props.formattedValue} 
                            height={30} 
                            width={"100%"}
                            zoomFactor={4} />
                    </div>
            }
        }
        return undefined;
    },
    
    // Override for Image type columns
    ["Image"]: (props, col) => {
        const imageSrc = "/Image/download.aspx?Entity=hip_trademark&Attribute=" + 
            col.colDefs[col.columnIndex].name + "&Id=" + col.rowData?.[RECID];
        
        return <div style={{ textAlign: 'center'}}>
                <ImageWithZoom 
                    src={imageSrc} 
                    height={42} 
                    width={42} 
                    zoomFactor={3} />
            </div>
    }
};
