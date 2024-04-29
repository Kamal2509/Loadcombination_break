
import * as React from 'react';
import { GuideBox, Panel } from '@midasit-dev/moaui';
import Sep from '@midasit-dev/moaui/Components/Separator';
import { useSnackbar,SnackbarProvider } from 'notistack';
import { Stack } from '@midasit-dev/moaui'
import * as Buttons from './Components/Buttons'
import { midasAPI } from './Function/Common';
import { VerifyUtil, VerifyDialog } from "@midasit-dev/moaui";
import Textfield from '@midasit-dev/moaui/Components/TextField';
import { CheckGroup,Check} from "@midasit-dev/moaui";
import { Button } from '@midasit-dev/moaui';
import { Radio, RadioGroup } from "@midasit-dev/moaui";
import { useEffect } from 'react';
import { useState } from 'react';



//Snack Bar
const enqueueMessage = (func, message, variant = "") => {
  func(
    message,
      {
        variant: variant,
        autoHideDuration: 3000,
        anchorOrigin:{ vertical: "top", horizontal: "center" }
      },
  );
};
const DEBOUNCE_DELAY = 300; // milliseconds
function Separator() {
	return (
		<div width="100%">
			<Sep direction="vertical" />
		</div>
	);
}

function App() 
{
const [showDialog, setDialogShowState] = useState(false);
const [comb, setComb]=useState({});
const [elem, setelement]=useState({});
const [firstSelectedElement, setFirstSelectedElement] = useState(null);
const { enqueueSnackbar } = useSnackbar()
const [selectedRadio, setSelectedRadio] = useState("");
const [newLoadCaseName, setNewLoadCaseName] = useState('');
const [selectedObject, setSelectedObject] = useState(null);
const [selectedPart, setSelectedPart] = useState("i"); // Default to "i" or set initial value as needed
const [selectedForce, setSelectedForce] = useState(null); 
let successfulEndpoint = null;


  const enqueueMessage = (func, message, variant = "") => {
    func(
      message,
        {
          variant: variant,
          autoHideDuration: 3000,
          anchorOrigin:{ vertical: "top", horizontal: "center" }
        },
    );
  };


  function debounce(func, delay) {
    let timeoutId;
    
    return function() {
      const context = this;
      const args = arguments;
      
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }
  
  const handleInputChangeDebounced = (value) => {
    // Handle the input change here
    // console.log('New value:', value);
    setNewLoadCaseName(value);
  };
  const debouncedHandleInputChange = debounce(handleInputChangeDebounced, 300);


async function searchLoadCombination(factor, vcombArray, newVCOMB, loadNames, loadCombinations, selectedObject, beamforces, userSelection) {
  // Map user selection to the corresponding index in force data
  const forceIndexMapping = {
      "Fx": 4,
      "Fy": 5,
      "Fz": 6,
      "Mx": 7,
      "My": 8,
      "Mz": 9
  };
  const selectedForceIndex = forceIndexMapping[userSelection];

  // Check if selectedObject.iTYPE is 1
  if (selectedObject.iTYPE === 1) {
      // Variables to track the maximum force value and corresponding factor
      let maxForceValue = Number.NEGATIVE_INFINITY;
      let maxVcombObj = null; // This will hold the vCOMB object with the maximum force value
      let maxCorrespondingFactor = 0; // This will hold the factor for the maximum force value

      // Iterate through each vCOMB object in the vcombArray
      for (const vcombObj of vcombArray) {
          // Extract the LCNAME from the vCOMB object
          const lcname = vcombObj.LCNAME;

          // Filter `beamforces.DATA` to find entries that match the current LCNAME (`lcname`)
          const filteredForces = beamforces.BeamForce.DATA.filter(force => force[2] === lcname);

          // Calculate the maximum selected force value and its corresponding factor
          for (const forceData of filteredForces) {
              // Calculate the selected force value
              const selectedForceValue = forceData[selectedForceIndex] * factor;

              // Update maxForceValue and correspondingFactor if necessary
              if (selectedForceValue > maxForceValue) {
                  maxForceValue = selectedForceValue;
                  maxVcombObj = vcombObj; // Update the maximum vCOMB object
                  maxCorrespondingFactor = factor * vcombObj.FACTOR; // Update the corresponding factor
              }
          }
      }

      // Handle the maximum vCOMB object found
      if (maxVcombObj) {
          // Check if LCNAME is present in loadNames
          if (loadNames.includes(maxVcombObj.LCNAME)) {
              // Update newVCOMB array
              const existingVCOMBIndex = newVCOMB.findIndex(item => item.LCNAME === maxVcombObj.LCNAME);
              if (existingVCOMBIndex !== -1) {
                  // Update the factor for the existing entry
                  newVCOMB[existingVCOMBIndex].FACTOR += maxCorrespondingFactor;
              } else {
                  // Add a new entry to newVCOMB
                  newVCOMB.push({
                      ANAL: maxVcombObj.ANAL,
                      LCNAME: maxVcombObj.LCNAME,
                      FACTOR: maxCorrespondingFactor
                  });
              }
          } else {
              // Search for lcname in loadCombinations and handle accordingly
              for (const loadCombination of Object.values(loadCombinations)) {
                  if (loadCombination.NAME === maxVcombObj.LCNAME) {
                      // If a match is found, call searchLoadCombination recursively
                      const newSelectedObject = loadCombination;
                      await searchLoadCombination(maxCorrespondingFactor, loadCombination.vCOMB, newVCOMB, loadNames, loadCombinations, newSelectedObject, beamforces, userSelection);
                      break; // Exit the loop after finding the match
                  }
              }
          }
      }
  } else {
      // If selectedObject.iTYPE is not 1, handle existing code
      for (const vcombObj of vcombArray) {
          // Check if vCOMB.LCNAME is present in loadNames array
          if (loadNames.includes(vcombObj.LCNAME)) {
              // Handle the existing code logic
              const existingVCOMBIndex = newVCOMB.findIndex(item => item.LCNAME === vcombObj.LCNAME);
              if (existingVCOMBIndex !== -1) {
                  // Update factor for existing entry
                  newVCOMB[existingVCOMBIndex].FACTOR += factor * vcombObj.FACTOR;
              } else {
                  // Add new entry to newVCOMB
                  newVCOMB.push({
                      ANAL: vcombObj.ANAL,
                      LCNAME: vcombObj.LCNAME,
                      FACTOR: factor * vcombObj.FACTOR
                  });
              }
          } else {
              // Handle loadCombinations search
              for (const loadCombination of Object.values(loadCombinations)) {
                  if (loadCombination.NAME === vcombObj.LCNAME) {
                      // Call searchLoadCombination recursively
                      await searchLoadCombination(factor * vcombObj.FACTOR, loadCombination.vCOMB, newVCOMB, loadNames, loadCombinations, selectedObject, beamforces, userSelection);
                  }
              }
          }
      }
  }

  // Return the modified newVCOMB array
  return newVCOMB;
}



async function add_envelope(selectedObject, loadNames, loadCombinations,selectedForce,beamforces) {
  // Check if all LCNAME values in the selectedObject's vCOMB are present in loadNames
  // const selectedObjectName = selectedObject.NAME;\
  const allLCNamesPresent = selectedObject.vCOMB.every(item => loadNames.includes(item.LCNAME));
  const newLoadCaseNameValue = selectedObject.Name || newLoadCaseName;
  // If all LCNAME values are present, send the complete vCOMB list to newLoadCombination function
  if (allLCNamesPresent) {
    console.log("All LCNAME values are present in loadNames:", selectedObject.vCOMB);
    const newObject = { ...selectedObject, NAME: newLoadCaseNameValue};
    console.log(newObject);
    return newObject;
  } else {
    // If not all LCNAME values are present, initialize factor as 1
    let factor = 1;
    // Initialize an empty array to store new vCOMB objects
    let newVCOMB = [];
    // Call searchLoadCombination with factor, selectedObjectName, vCOMB array, and newVCOMB array
    searchLoadCombination(factor, selectedObject.vCOMB, newVCOMB, loadNames, loadCombinations,selectedObject,beamforces, selectedForce);
    console.log(newVCOMB);
    const newObject = { ...selectedObject, NAME: newLoadCaseNameValue,vCOMB: newVCOMB };
    console.log(newObject);
    return newObject;
  }

}


async function BreakdownData(selectedForce) {
  try {
      // Fetch the necessary data
      // const beamforces = await fetchDataOnce();
      await fetchData();
      const LoadCombinations = comb;
      console.log(LoadCombinations);
      loadCombinations = Object.values(LoadCombinations);
      console.log(LoadCombinations);
      console.log(loadCombinations);
      const element = await fetchElement();
    
      const inputObject = {
        Argument: {
          TABLE_NAME: "BeamForce",
          TABLE_TYPE: "BEAMFORCE",
          EXPORT_PATH: "C:\\MIDAS\\Result\\Output.JSON",
          "UNIT": {
            "FORCE": "kN",
            "DIST": "m"
        },
          STYLES: {
            FORMAT: "Fixed",
            PLACE: 12
          },
          COMPONENTS: [
            "Elem",
            "Load",
            "Part",
            "Axial",
            "Shear-y",
            "Shear-z",
            "Torsion",
            "Moment-y",
            "Moment-z",
            "Bi-Moment",
            "T-Moment",
            "W-Moment"
          ],
          NODE_ELEMS: {
            
              KEYS: element|| [1]
          
          },
          LOAD_CASE_NAMES: [
            "load(CB:all)"
          ],
          PARTS: [
            `Part ${selectedPart}`
          ]
        }
      };
      const stct = await midasAPI("GET", "/db/stct");
      const stldData = await midasAPI("GET", "/db/stld");
      const smlc = await midasAPI("GET","/db/smlc");
      const mvld = await midasAPI("GET","/db/mvld");
      const loadNames = ["Dead Load", "Tendon Primary", "Creep Primary", "Shrinkage Primary","Tendon Secondary","Creep Secondary","Shrinkage Secondary"];
      const loadCombinationNames = Object.values(loadCombinations)
      .filter(combination => typeof combination === 'object') // Filter out non-object properties
      .map(combination => {
        if (combination.iTYPE === 1) {
          return `${combination.NAME}(CB:all)`;
        } else {
          if (combination.iTYPE === 0) {
          return `${combination.NAME}(CB)`;
          }
        }
      });
      /// push static loadcase construction stage in loadNames array ///
      if (stct && stct.STCT) {
          for (const key in stct.STCT) {
              const item = stct.STCT[key];
              if (item.vEREC) {
                  item.vEREC.forEach(erec => {
                      if (erec.LTYPECC) {
                          loadNames.push(erec.LTYPECC);
                          loadCombinationNames.push(`${erec.LTYPECC}(CS)`);
                      }
                  });
              }
          }
      }
      
      /// push static loadcase in loadNames array ///
      if (stldData && Object.keys(stldData)[0].length > 0) {
          const stldKeys = Object.keys(stldData)[0];
          if (stldKeys && stldKeys.length > 0) {
              for (const key in stldData[stldKeys]) {
                  if (stldData[stldKeys].hasOwnProperty(key)) {
                    const name = stldData[stldKeys][key].NAME;
                    loadNames.push(name);
                    loadCombinationNames.push(`${name}(ST)`);
                  }
              }
          }
      }

      /// push settlement loadcase in loadNames array ///
      if (smlc && smlc.SMLC) {
        for (const key in smlc.SMLC) {
            const item = smlc.SMLC[key];
            if (item.NAME) {
              const smlcName = item.NAME;
              // Push smlcName into both arrays
              loadNames.push(smlcName);
              loadCombinationNames.push(`${smlcName}(SM:all)`);
            }
        }
    }

/// push moving laodcase in loadNames array ///
    if (mvld && mvld.MVLD) {
  
      // Iterate through each key in the MVLD object
      for (const key in mvld.MVLD) {
          if (mvld.MVLD.hasOwnProperty(key)) {
              // Get the item corresponding to the current key in MVLD
              const item = mvld.MVLD[key];
  
              // Check if the item has an LCNAME property
              if (item && item.LCNAME) {
                  // Add the LCNAME to the array
                  loadNames.push(item.LCNAME);
                  loadCombinationNames.push(`${item.LCNAME}(MV:all)`);
              }
          }
      }
  
  }
  

    console.log("Load Names:", loadNames);
    
    console.log("Load Combination:",loadCombinationNames)
       // Update the Argument object with the formatted LOAD_CASE_NAMES array
       const updatedArgument = {
         ...inputObject.Argument,
         LOAD_CASE_NAMES: loadCombinationNames.map(name => `${name}`)
       };
       console.log(updatedArgument);
    
       const forces = await midasAPI("POST", "/post/table", { Argument : updatedArgument});
    
       console.log('Beamforces:', forces);
      

      // Find the selected combination
      const selectedComb = combArray.find(item => item.NAME === selectedRadio);
      console.log("Selected combination:", selectedComb);
      
      if (!selectedComb) {
          console.log("Error: No selected combination found.");
          return;
      }
      
      console.log("iTYPE of selected combination:", selectedComb.iTYPE);
      
      let updatedObject;
      if (selectedComb.iTYPE === 0 || selectedComb.iTYPE === 1) {
          // Add
          console.log("iTYPE is 0 (add) & iTYPE is 1 (envelope");
          updatedObject = await add_envelope(selectedComb, loadNames, loadCombinations,selectedForce,forces);
      }
      
      if (updatedObject) {
          // Update the database
          const lastLoadCombinationID = Object.keys(loadCombinations).length;
          const newLoadCombinationID = lastLoadCombinationID + 1;
          console.log(lastLoadCombinationID);
          
          const payload = {
              Assign: updatedObject
          };
          console.log(successfulEndpoint)
          const newLoad = await midasAPI("PUT", `${successfulEndpoint}/${newLoadCombinationID}`, payload);
          console.log("Updated object:", newLoad);
      } else {
          console.log("Error: Updated object is null.");
      }

  } catch (error) {
      console.error("Error in BreakdownData:", error);
  }
}

let loadCombinations;


function handleInputChange(value) {
  setNewLoadCaseName(value);
}


async function fetchElement() {
  try {
    // Call midasAPI to get the element data
    const response = await midasAPI("GET", "/view/select");

    if (response.error) {
      console.error(`Error fetching element data: ${response.error.message}`);
      return null;
    }

    const elements = response["SELECT"]["ELEM_LIST"];
    console.log("Elements:", elements);

    setFirstSelectedElement(elements[0]);
    setelement(elements);
    return elements;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Call `fetchElement` inside `useEffect` only when the component is mounted.
useEffect(() => {
  fetchElement();
}, []);



const handleClick = () => {
    enqueueMessage(enqueueSnackbar, "Select only one element", "error");
  };

 
  async function fetchData() {
    try {
        let resLoadCombinations = null;

        // Define a list of endpoints and their respective expected data keys
        const endpointsDataKeys = [
            { endpoint: "/db/lcom-gen", dataKey: "LCOM-GEN" },
            { endpoint: "/db/lcom-conc", dataKey: "LCOM-CONC" },
            { endpoint: "/db/lcom-src", dataKey: "LCOM-SRC" },
            { endpoint: "/db/lcom-steel", dataKey: "LCOM-STEEL" },
            { endpoint: "/db/lcom-stlcomp", dataKey: "LCOM-STLCOMP" }
        ];

        // Iterate through the endpoints and attempt to fetch data from each
        for (const { endpoint, dataKey } of endpointsDataKeys) {
          try {
              // Make a GET request to the endpoint
              const response = await midasAPI("GET", endpoint);
              
              // Check if the response does not contain any error
              if (response && !response.error) {
                  // Data is found and there is no error, handle it based on the endpoint
                  setComb(response[dataKey]);
                  console.log(`Data from ${endpoint}:`, response[dataKey]);
                  successfulEndpoint = endpoint;
                  return; // Exit the function since data is found and handled
              } else {
                  console.error(`Error in response from ${endpoint}:`, response.error);
              }
          } catch (error) {
              // Log the error and continue to the next endpoint
              console.error(`Error fetching data from ${endpoint}:`, error);
          }
      }

        // If all endpoints failed to return data or returned empty data, log a message
        console.log("Load Combinations: No data found in any of the endpoints.");
    } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error if needed
    }
}


useEffect(() => {
    if (
      !VerifyUtil.isExistQueryStrings("redirectTo") &&
      !VerifyUtil.isExistQueryStrings("mapiKey")
    ) {
      setDialogShowState(true);
    }
  }, []);
// const { enqueueSnackbar } = useSnackbar();
const combArray=Object.values(comb);
const elementArray=Object.values(elem);
console.log(elementArray);


  //Main UI
  return (
    <div className="App" >
      {/* {showDialog && <MKeyDialog />} */}
      {showDialog && <VerifyDialog />}
      <GuideBox
        padding={2}
        center
      >
      <Panel width={520} height={380} variant='shadow2'>
          <div style={{display: 'flex', justifyContent:'space-between'}}>
        
          <Panel width={255} height={300} marginX={1} marginTop={2}>
            <div style={{ color: 'gray', fontSize: '14px', marginBottom: '10px' }}>Select Load Combination</div>
             {/* Added wrapping div with overflow-y: auto for scrollbar */}
             <div style={{ overflowY: 'auto', maxHeight: '250px' }}>
              <RadioGroup onChange={(e) => setSelectedRadio(e.target.value)}>
                {combArray.map((c) => (
                <Radio key={c.NAME} name={c.NAME} value={c.NAME} />
                  ))}
                 </RadioGroup>
               </div>
          </Panel>

          <Panel width={255} height={300} marginTop={2} padding={0.25}>
            <div style={{display: 'flex',flexDirection:'column',margin:"10px",justifyContent:'space-between'}}>
            <span style={{ fontSize: '14px', color: 'gray' }}>Options for Breakdown</span>
            <br></br>
            <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{ fontSize: '14px', height: '24px', display: 'inline-block', verticalAlign: 'bottom', marginTop: '4px' }}>LCB Title:</span>
              {/* <Textfield  id="my-textfield" defaultValue="" height={{height: "0px"}} onChange={function noRefCheck(){}} placeholder="placeholder text" title="" titlewidth="70px" width="120px" spacing="50px"/ > */}
              <Textfield
                id="load-case-name"
                value={newLoadCaseName}
                // onChange={(e) => setNewLoadCaseName(e.target.value)}
                // onChange={(e) => handleInputChangeDebounced(e.target.value)} // Debounced handler
                onChange={(e) => debouncedHandleInputChange(e.target.value, setNewLoadCaseName)} // Debounced handler
                placeholder={selectedObject ? selectedObject.Name : "Enter load case name"}
                title=""
                titlewidth="70px"
                width="100px"
                spacing="50px"
              />
            </div>
            <br></br>
            <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{ fontSize: '14px',marginTop: '0px'}}>Target Element</span>
              <div style={{ borderBottom: '1px solid gray', height: '16px', width: '100px',display:'flex', justifyContent:'center',alignItems:'center'}}>
        <div style={{ fontSize: '12px', paddingBottom: '2px' }}>
           {elementArray.length > 1 ? handleClick(): (
    <div>
      {firstSelectedElement}
    </div>
  )}
</div>
              </div>
            </div>
            <br></br>
            <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{ fontSize: '14px' }}>Element</span>
            <RadioGroup
    margin={1}
    onChange={(e) => setSelectedPart(e.target.value)} // Update state variable based on user selection
    value={selectedPart} // Bind the state variable to the RadioGroup
    text=""
>
    <div
        style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'start',
            justifyContent: 'space-between',
            marginRight: '5px',
            height: '20px',
            width: '70px'
        }}
    >
        <Radio
            name="i"
            value="I"
            label="Part I" // Optional: Add a label for clarity
            checked={selectedPart === "I"} // Check this Radio if the selectedPart is "i"
        />
        <Radio
            name="j"
            value="J"
            label="Part J" // Optional: Add a label for clarity
            checked={selectedPart === "J"} // Check this Radio if the selectedPart is "j"
        />
    </div>
</RadioGroup>
            
            </div>
            </div>
            <Separator /> 
            <div style={{display: 'flex',flexDirection:'column',margin:"10px",justifyContent:'space-between'}}>
            <span style={{ fontSize: '14px', color: 'gray',marginBottom:'6px' }}>Critical L.C from View by Max Value</span>
            <CheckGroup text="">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', height: 'fit-content', width: '100%', margin: '0', marginBottom: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Check
            name="Fx"
            width="100px"
            height="30px"
            checked={selectedForce === 'Fx'}
            onChange={() => setSelectedForce('Fx')}
        />
        <div style={{marginRight:"0.4px"}}>
        <Check
            name="Fy"
            width="100px"
            height="30px"
            checked={selectedForce === 'Fy'}
            onChange={() => setSelectedForce('Fy')}
        />
        </div>
        <div style={{marginRight: "4.2px"}}>
        <Check
            name="Fz"
            height="30px"
            checked={selectedForce === 'Fz'}
            onChange={() => setSelectedForce('Fz')}
        />
        </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
        <Check
            name="Mx"
            checked={selectedForce === 'Mx'}
            onChange={() => setSelectedForce('Mx')}
        />
        <Check
            name="My"
            checked={selectedForce === 'My'}
            onChange={() => setSelectedForce('My')}
        />
        <Check
            name="Mz"
            checked={selectedForce === 'Mz'}
            onChange={() => setSelectedForce('Mz')}
        />
    </div>
</div>

        <div style={{ display:'flex', alignItems:"centre",justifyContent:"centre", width: '100%', height: '80px' ,marginLeft:"0px"}}>
        <Button color="normal" onClick={function noRefCheck(){}} width="100%" variant="outlined" style={{ color: 'black'}}>
          Select All
        </Button>
        </div>
      </CheckGroup>
            </div>
      </Panel>
        </div>
          <br></br>
         <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0px', marginTop: '0', marginBottom: '30px' }}>
              {Buttons.NormalButton("contained", "Import Load Combinations", fetchData)}
              {Buttons.MainButton("contained", "Breakdown", () => BreakdownData(selectedForce))}
          </div>
      </Panel>
         
      </GuideBox>
	</div>
  );
}

function AppWithSnackbar() {
  return (
    <SnackbarProvider maxSnack={1}>
       <App />
    </SnackbarProvider>
  );
}


{/* export default AppWithSnackbar; */}
export default AppWithSnackbar;
