import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import {PluginIcon} from './components/PluginIcon';
import * as yup from 'yup';
import { initPrism } from './utils/prism-init';

export default {
  register(app: any) {

    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
    });

    app.customFields.register({
      name: PLUGIN_ID,
      pluginId: PLUGIN_ID,
      type: 'json',
      icon: PluginIcon,
      required: true,
      intlLabel: {
        id: `${PLUGIN_ID}.field.label`,
        defaultMessage: 'Rich Text Blocks (Extended)',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.field.description`,
        defaultMessage: 'An extended version of the JSON based native strapi field "Rich Text (Blocks)"',
      },
      components: {
        Input: async () => import('./components/Input'),
      },
      options: {
        base: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.section.basic-settings`,
              defaultMessage: "Basic Settings (Label:Value)",
            },
            items:[
              {
                name: 'options.disableDefaultFonts',
                type: 'checkbox',
                intlLabel: {
                  id: `${PLUGIN_ID}.disableDefaultFonts`,
                  defaultMessage: 'Disable default fonts?',
                },
                description: {
                  id: `${PLUGIN_ID}.disableDefaultFonts.description`,
                  defaultMessage: 'If enabled, custom font presets will be used',
                },
              },
              {
                name: 'options.customFontsPresets',
                type: 'textarea',
                placeholder: {
                  id: `${PLUGIN_ID}.customFontsPresets.placeholder`,
                  defaultMessage: "Arial:arial\nOpen Sans:open-sans\nTimes New Roman:times-new-roman\nGeorgia:georgia",
                },
                intlLabel: {
                  id: `${PLUGIN_ID}.customFontsPresets`,
                  defaultMessage: 'Custom font presets',
                },
                description: {
                  id: `${PLUGIN_ID}.customFontsPresets.description`,
                  defaultMessage: 'These values will override default font options. One per line.',
                },
              },
              {
                name: 'options.disableDefaultColors',
                type: 'checkbox',
                intlLabel: {
                  id: `${PLUGIN_ID}.disableDefaultColors`,
                  defaultMessage: 'Disable default colors?',
                },
                description: {
                  id: `${PLUGIN_ID}.disableDefaultColors.description`,
                  defaultMessage: 'If enabled, custom color presets will be used',
                },
              },
              {
                name: 'options.customColorsPresets',
                type: 'textarea',
                placeholder: {
                  id: `${PLUGIN_ID}.customColorsPresets.placeholder`,
                  defaultMessage: "Black:#000000\nWhite:#FFFFFF\nGray:#808080\nLight Gray:#D3D3D3\nDark Gray:#A9A9A9\nRed:#FF0000\nDark Pink:#FF1493\nPink:#FFC0CB\nLight Pink:#FFB6C1\nOrange:#FFA500\nDark Orange:#FF8C00\nLight Orange:#FFDAB9\nYellow:#FFFF00\nDark Yellow:#FFD700\nLight Yellow:#FFFFE0\nGreen:#00FF00\nDark Green:#006B3C\nLight Green:#90EE90\nBlue:#0000FF\nDark Blue:#000080\nLight Blue:#ADD8E6\nPurple:#800080\nDark Purple:#800080\nLight Purple:#E6E6FA\nBrown:#A52A2A\nDark Brown:#A52A2A\nLight Brown:#F5DEB3",
                },
                intlLabel: {
                  id: `${PLUGIN_ID}.customColorsPresets`,
                  defaultMessage: 'Custom color presets',
                },
                description: {
                  id: `${PLUGIN_ID}.customColorsPresets.description`,
                  defaultMessage: 'These values will override default color options. One per line.',
                },
              },
            ]
          }
        ],
        advanced: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.section.advanced-settings`,
              defaultMessage: "Advanced Settings (Label:Value)",
            },
            items: [
              {
                name: 'options.disableDefaultViewports',
                type: 'checkbox',
                intlLabel: {
                    id: `${PLUGIN_ID}.disableDefaultViewports`,
                    defaultMessage: 'Disable default viewports?',
                  },
                  description: {
                    id: `${PLUGIN_ID}.disableDefaultViewports.description`,
                    defaultMessage: 'If enabled, custom viewports will be used',
                  },
                },
                {
                  name: 'options.customViewportsPresets',
                  type: 'textarea',
                  placeholder: {
                    id: `${PLUGIN_ID}.customViewportsPresets.placeholder`,
                    defaultMessage: "Mobile:mobile\nTablet:tablet\nDesktop:desktop",
                  },
                  intlLabel: {
                    id: `${PLUGIN_ID}.customViewportsPresets`,
                    defaultMessage: 'Custom viewports presets',
                  },
                  description: {
                    id: `${PLUGIN_ID}.customViewportsPresets.description`,
                    defaultMessage: 'These values will override default viewport options. One per line.',
                  },
              },
              {
                name: 'options.disableDefaultSizes',
                type: 'checkbox',
                intlLabel: {
                    id: `${PLUGIN_ID}.disableDefaultSizes`,
                    defaultMessage: 'Disable default sizes?',
                  },
                  description: {
                    id: `${PLUGIN_ID}.disableDefaultSizes.description`,
                    defaultMessage: 'If enabled, custom sizes will be used',
                  },
                },
                {
                  name: 'options.customSizesPresets',
                  type: 'textarea',
                  placeholder: {
                    id: `${PLUGIN_ID}.customSizesPresets.placeholder`,
                    defaultMessage: "6\n8\n9\n10\n11\n12\n14\n16\n18\n24\n30\n48\n60\n72\n150\n300",
                  },
                  intlLabel: {
                    id: `${PLUGIN_ID}.customSizesPresets`,
                    defaultMessage: 'Custom sizes presets',
                  },
                  description: {
                    id: `${PLUGIN_ID}.customSizesPresets.description`,
                    defaultMessage: 'These values will override default size options. One per line.',
                  },
              },
              {
                name: 'options.disableDefaultLineHeights',
                type: 'checkbox',
                intlLabel: {
                    id: `${PLUGIN_ID}.disableDefaultLineHeights`,
                    defaultMessage: 'Disable default line heights?',
                  },
                  description: {
                    id: `${PLUGIN_ID}.disableDefaultLineHeights.description`,
                    defaultMessage: 'If enabled, custom line heights will be used',
                  },
                },
                {
                  name: 'options.customLineHeightsPresets',
                  type: 'textarea',
                  placeholder: {
                    id: `${PLUGIN_ID}.customLineHeightsPresets.placeholder`,
                    defaultMessage: "6\n8\n9\n10\n11\n12\n14\n16\n18\n24\n30\n48\n60\n72\n150\n300",
                  },
                  intlLabel: {
                    id: `${PLUGIN_ID}.customLineHeightsPresets`,
                    defaultMessage: 'Custom line heights presets',
                  },
                  description: {
                    id: `${PLUGIN_ID}.customLineHeightsPresets.description`,
                    defaultMessage: 'These values will override default line height options. One per line.',
                  },
              },
              {
                name: 'options.disableDefaultTracking',
                type: 'checkbox',
                intlLabel: {
                    id: `${PLUGIN_ID}.disableDefaultTracking`,
                    defaultMessage: 'Disable default letter spacing?',
                  },
                  description: {
                    id: `${PLUGIN_ID}.disableDefaultTracking.description`,
                    defaultMessage: 'If enabled, custom letter spacing values will be used',
                  },
                },
                {
                  name: 'options.customTrackingPresets',
                  type: 'textarea',
                  placeholder: {
                    id: `${PLUGIN_ID}.customTrackingPresets.placeholder`,
                    defaultMessage: "-100\n-75\n-50\n-25\n-10\n-5\n0\n5\n10\n25\n50\n75\n100\n200",
                  },
                  intlLabel: {
                    id: `${PLUGIN_ID}.customTrackingPresets`,
                    defaultMessage: 'Custom letter spacing presets',
                  },
                  description: {
                    id: `${PLUGIN_ID}.customTrackingPresets.description`,
                    defaultMessage: 'These values will override default letter spacing options. One per line.',
                  },
              },
              {
                name: 'options.disableDefaultAlignments',
                type: 'checkbox',
                intlLabel: {
                    id: `${PLUGIN_ID}.disableDefaultAlignments`,
                    defaultMessage: 'Disable default alignments?',
                  },
                  description: {
                    id: `${PLUGIN_ID}.disableDefaultAlignments.description`,
                    defaultMessage: 'If enabled, custom alignments will be used',
                  },
                },
                {
                  name: 'options.customAlignmentsPresets',
                  type: 'textarea',
                  placeholder: {
                    id: `${PLUGIN_ID}.customAlignmentsPresets.placeholder`,
                    defaultMessage: "Left:left\nCenter:center\nRight:right\nJustify:justify",
                  },
                  intlLabel: {
                    id: `${PLUGIN_ID}.customAlignmentsPresets`,
                    defaultMessage: 'Custom alignments presets',
                  },
                  description: {
                    id: `${PLUGIN_ID}.customAlignmentsPresets.description`,
                    defaultMessage: 'These values will override default alignment options. One per line.',
                  },
              }
            ]
          }
        ],
        validator: (args: any) => {  
          const { 
            disableDefaultFonts = false, 
            disableDefaultColors = false,
            disableDefaultViewports = false, 
            disableDefaultSizes = false, 
            disableDefaultLineHeights = false, 
            disableDefaultTracking = false, 
            disableDefaultAlignments = false,
          } = args[2].modifiedData.options || {};

          const hasDuplicateLines = (lines: string[]) => {
            const uniqueLines = new Set(lines);
            return lines.length !== uniqueLines.size;
          };

          const validateStringPreset = (value: string | undefined) => {
            if (!value) return true;
            
            const lines = value.split('\n');
            const lineRegex = /^[a-zA-Z]+(?:\s+[a-zA-Z]+)*:(?:[a-zA-Z][-a-zA-Z0-9]*|#[0-9A-Fa-f]+)$/;
            
            if (lines.some(line => !line || line.trim() === '')) return false;
            if (!lines.every(line => lineRegex.test(line))) return false;
            if (hasDuplicateLines(lines)) return false;

            return true;
          };

          const validateNumericPreset = (value: string | undefined, allowNegative: boolean = false) => {
            if (!value) return true;
            
            const lines = value.split('\n');
            const numberRegex = allowNegative ? /^-?\d*\.?\d+$/ : /^\d*\.?\d+$/;
            
            if (lines.some(line => !line || line.trim() === '')) return false;
            if (!lines.every(line => numberRegex.test(line))) return false;
            if (hasDuplicateLines(lines)) return false;

            return true;
          };

          const errorMessages = {
            required: 'This field is required',
            badStringFormat: 'Each line must be in format "label:value" (no spaces or duplicates allowed)',
            badNumericFormat: 'Each line must be a valid number (no spaces or duplicates allowed)',
          };

          const createValidation = (
            fieldName: string, 
            isDisabled: boolean, 
            isNumeric: boolean = false, 
            allowNegative: boolean = false
          ) => {
            const baseSchema = isDisabled ? yup.string().required(errorMessages.required) : yup.string().optional();
            const validator = isNumeric ? 
              (value: string | undefined) => validateNumericPreset(value, allowNegative) : 
              validateStringPreset;
            const message = isNumeric ? errorMessages.badNumericFormat : errorMessages.badStringFormat;

            return baseSchema.test(fieldName, {
              id: `error.${fieldName}`,
              defaultMessage: message,
            }, validator);
          };
           
          return {
            customFontsPresets: createValidation('customFontsPresets', disableDefaultFonts),
            customColorsPresets: createValidation('customColorsPresets', disableDefaultColors),
            customViewportsPresets: createValidation('customViewportsPresets', disableDefaultViewports),
            customSizesPresets: createValidation('customSizesPresets', disableDefaultSizes, true),
            customLineHeightsPresets: createValidation('customLineHeightsPresets', disableDefaultLineHeights, true),
            customTrackingPresets: createValidation('customTrackingPresets', disableDefaultTracking, true, true),
            customAlignmentsPresets: createValidation('customAlignmentsPresets', disableDefaultAlignments),
          };
        },
      },
    });
  },

  async bootstrap(app: any) {
    await initPrism();
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
