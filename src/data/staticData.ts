export const FIRST_NAMES = [
  'James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','William','Barbara',
  'David','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen',
  'Christopher','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra',
  'Donald','Ashley','Steven','Dorothy','Paul','Kimberly','Andrew','Emily','Kenneth','Donna',
  'Joshua','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah',
  'Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia',
  'Jacob','Kathleen','Gary','Amy','Nicholas','Angela','Eric','Shirley','Jonathan','Anna',
  'Stephen','Brenda','Larry','Pamela','Justin','Emma','Scott','Nicole','Brandon','Helen',
  'Benjamin','Samantha','Samuel','Katherine','Raymond','Christine','Gregory','Debra','Frank','Rachel',
  'Alexander','Carolyn','Patrick','Janet','Jack','Catherine','Dennis','Maria','Jerry','Heather',
  'Tyler','Diane','Aaron','Julie','Jose','Joyce','Adam','Victoria','Henry','Ruth',
  'Zachary','Lauren','Douglas','Kelly','Peter','Christina','Kyle','Joan','Ethan','Evelyn',
]

export const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes',
  'Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper',
  'Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson',
  'Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes',
  'Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez',
]

export const CITIES = [
  { city: 'New York', state: 'NY', zips: ['10001','10002','10003','10004','10005'] },
  { city: 'Los Angeles', state: 'CA', zips: ['90001','90002','90003','90004','90005'] },
  { city: 'Chicago', state: 'IL', zips: ['60601','60602','60603','60604','60605'] },
  { city: 'Houston', state: 'TX', zips: ['77001','77002','77003','77004','77005'] },
  { city: 'Phoenix', state: 'AZ', zips: ['85001','85002','85003','85004','85005'] },
  { city: 'Philadelphia', state: 'PA', zips: ['19101','19102','19103','19104','19105'] },
  { city: 'San Antonio', state: 'TX', zips: ['78201','78202','78203','78204','78205'] },
  { city: 'San Diego', state: 'CA', zips: ['92101','92102','92103','92104','92105'] },
  { city: 'Dallas', state: 'TX', zips: ['75201','75202','75203','75204','75205'] },
  { city: 'San Jose', state: 'CA', zips: ['95101','95102','95103','95104','95105'] },
  { city: 'Austin', state: 'TX', zips: ['73301','73344','78701','78702','78703'] },
  { city: 'Jacksonville', state: 'FL', zips: ['32099','32201','32202','32203','32204'] },
  { city: 'Fort Worth', state: 'TX', zips: ['76101','76102','76103','76104','76105'] },
  { city: 'Columbus', state: 'OH', zips: ['43085','43201','43202','43203','43204'] },
  { city: 'Charlotte', state: 'NC', zips: ['28201','28202','28203','28204','28205'] },
  { city: 'Indianapolis', state: 'IN', zips: ['46201','46202','46203','46204','46205'] },
  { city: 'San Francisco', state: 'CA', zips: ['94101','94102','94103','94104','94105'] },
  { city: 'Seattle', state: 'WA', zips: ['98101','98102','98103','98104','98105'] },
  { city: 'Denver', state: 'CO', zips: ['80201','80202','80203','80204','80205'] },
  { city: 'Nashville', state: 'TN', zips: ['37201','37202','37203','37204','37205'] },
  { city: 'Oklahoma City', state: 'OK', zips: ['73101','73102','73103','73104','73105'] },
  { city: 'El Paso', state: 'TX', zips: ['79901','79902','79903','79904','79905'] },
  { city: 'Boston', state: 'MA', zips: ['02101','02102','02103','02104','02105'] },
  { city: 'Las Vegas', state: 'NV', zips: ['89101','89102','89103','89104','89105'] },
  { city: 'Portland', state: 'OR', zips: ['97201','97202','97203','97204','97205'] },
  { city: 'Memphis', state: 'TN', zips: ['38101','38103','38104','38105','38106'] },
  { city: 'Louisville', state: 'KY', zips: ['40201','40202','40203','40204','40205'] },
  { city: 'Baltimore', state: 'MD', zips: ['21201','21202','21203','21204','21205'] },
  { city: 'Milwaukee', state: 'WI', zips: ['53201','53202','53203','53204','53205'] },
  { city: 'Albuquerque', state: 'NM', zips: ['87101','87102','87103','87104','87105'] },
]

export const STREET_TYPES = ['St','Ave','Blvd','Dr','Ln','Way','Ct','Pl','Rd','Pkwy']
export const STREET_NAMES = [
  'Main','Oak','Maple','Cedar','Pine','Elm','Washington','Park','Lake','Hill',
  'River','Spring','Sunset','Highland','Meadow','Forest','Valley','Summit','Ridge','Canyon',
]

export const MCCs: { code: string; label: string; category: string }[] = [
  { code: '5411', label: 'Grocery Stores', category: 'grocery' },
  { code: '5912', label: 'Drug Stores', category: 'health' },
  { code: '5541', label: 'Gas Stations', category: 'fuel' },
  { code: '5812', label: 'Restaurants', category: 'dining' },
  { code: '5311', label: 'Department Stores', category: 'retail' },
  { code: '5661', label: 'Shoe Stores', category: 'retail' },
  { code: '5945', label: 'Hobby & Toy Stores', category: 'retail' },
  { code: '7011', label: 'Hotels', category: 'travel' },
  { code: '4511', label: 'Airlines', category: 'travel' },
  { code: '7523', label: 'Parking', category: 'auto' },
  { code: '5732', label: 'Electronics', category: 'retail' },
  { code: '5999', label: 'Miscellaneous Retail', category: 'retail' },
  { code: '8011', label: 'Doctors', category: 'health' },
  { code: '8049', label: 'Dentists', category: 'health' },
  { code: '7996', label: 'Amusement Parks', category: 'entertainment' },
  { code: '5813', label: 'Bars & Taverns', category: 'dining' },
  { code: '5411', label: 'Grocery Stores', category: 'grocery' },
  { code: '4814', label: 'Telecom', category: 'utilities' },
  { code: '4900', label: 'Utilities', category: 'utilities' },
  { code: '5940', label: 'Sporting Goods', category: 'retail' },
]

export const MERCHANT_NAMES = [
  'Sunrise Market','Blue Ridge Diner','Metro Electronics','Harbor View Hotel',
  'Quickstop Gas','Summit Pharmacy','Riverside Grill','City Sports',
  'Oakwood Dental','Pine Valley Clinic','Golden Gate Bistro','Lakeside Cinema',
  'Central Auto Parts','Valley Supermarket','Mountain Peak Coffee','Urban Threads',
  'Coastal Seafood','Highland Hardware','Desert Sun Rentals','Meadow Bakery',
  'North Star Deli','Pacific Rim Sushi','Westside Yoga','East End Burgers',
  'Silverton Books','Copper Kitchen','Ironwood Fitness','Willow Creek Spa',
  'Redwood Tavern','Maple Street Cafe','Canyon View Market','Stonegate Hotel',
  'Bayfront Parking','Harbor Lights Grill','Northgate Mall','Sunrise Urgent Care',
  'Greenfield Grocers','Clearwater Pharmacy','Bluebell Florist','Timber Ridge Sports',
]

export const PRODUCT_CODES_A = ['VENTURE_X','QUICKSILVER','SAVOR_ONE','PLATINUM','SPARK_BUSI','SECURED_MC','VENTURE_REWARDS']
export const PRODUCT_CODES_B = ['DISC_IT_CASH','DISC_IT_MILES','DISC_CHROME','DISC_SECURED','DISC_STUDENT_LOAN','DISC_PERSONAL_LOAN','DISC_SAVINGS_HY']

export const ACQUIRER_IDS = ['ACQ-001','ACQ-002','ACQ-003','ACQ-004','ACQ-005']
export const ACQUIRER_NAMES: Record<string, string> = {
  'ACQ-001': 'First Data',
  'ACQ-002': 'Worldpay',
  'ACQ-003': 'Heartland',
  'ACQ-004': 'TSYS',
  'ACQ-005': 'Elavon',
}

export const ISSUER_BINS: Record<string, { name: string; type: 'consumer' | 'commercial'; tier: string }> = {
  '414720': { name: 'Capital One', type: 'consumer', tier: 'platinum' },
  '414721': { name: 'Capital One', type: 'commercial', tier: 'signature' },
  '414722': { name: 'Capital One', type: 'consumer', tier: 'gold' },
  '601100': { name: 'Discover', type: 'consumer', tier: 'standard' },
  '601101': { name: 'Discover', type: 'consumer', tier: 'platinum' },
  '435544': { name: 'Chase', type: 'consumer', tier: 'signature' },
  '435545': { name: 'Chase', type: 'commercial', tier: 'infinite' },
  '400000': { name: 'Bank of America', type: 'consumer', tier: 'gold' },
  '400001': { name: 'Bank of America', type: 'commercial', tier: 'signature' },
  '490303': { name: 'Wells Fargo', type: 'consumer', tier: 'standard' },
  '490304': { name: 'Wells Fargo', type: 'commercial', tier: 'platinum' },
  '540111': { name: 'Citibank', type: 'consumer', tier: 'gold' },
  '540112': { name: 'Citibank', type: 'commercial', tier: 'signature' },
  '517805': { name: 'US Bank', type: 'consumer', tier: 'standard' },
  '517806': { name: 'US Bank', type: 'commercial', tier: 'platinum' },
}

export const NAICS_CODES = [
  '522110','522120','522210','523110','523120','524113','524126','531110','541110','541511',
  '551111','561320','611310','621111','711110','722511','811111','446110','447110','452111',
]

export const FRAUD_PATTERN_TYPES = ['ring','mule','synthetic','bust_out','laundering'] as const

export const EMAILS_DOMAINS = ['gmail.com','yahoo.com','outlook.com','icloud.com','hotmail.com','aol.com','proton.me']
