// sign.js - Combined Firebase email/password signup + login + Uploadcare upload + Paystack
// CONFIG: update these if needed
const REGISTRATION_FEE_NGN = 2950;
const PAYSTACK_KEY = 'pk_live_c70b41f949305738598a184d69c57c0b24eba0f3'; // replace with your Paystack key
const SAVE_USER_ENDPOINT = '/api/auth/register'; // optional server hook (not required if using Firebase)

// UPLOADCARE settings (replaces Imgur)
const UPLOADCARE_PUBLIC_KEY = "2683b7806064b3db73e3"; // <-- replace with your Uploadcare public key
const UPLOADCARE_BASE_UPLOAD = "https://upload.uploadcare.com/base/"; // REST upload endpoint
const UPLOADCARE_CDN = "https://12hsb3bgrj.ucarecd.net/"; // CDN base for uploaded files

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
  authDomain: "campus-leaders.firebaseapp.com",
  projectId: "campus-leaders",
  storageBucket: "campus-leaders.firebasestorage.app",
  messagingSenderId: "445360528951",
  appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
};

// Admin emails: users who should be redirected to admin.html after login
// Add lowercase emails here, e.g. ['admin@example.com']
const ADMIN_EMAILS = [
  // add admin emails (lowercase)
  'campusleader@gmail.com'
];

// ========== keep the stateSchools object EXACTLY as you provided ==========
const stateSchools = {
  "Abia": [
    "Michael Okpara University of Agricultural Umudike",
    "Abia State University, Uturu",
    "Gregory University, Uturu",
    "Clifford University Owerrinta Abia State",
    "Spiritan University, Nneochi Abia State",
    "Nigerian British University, Asa, Abia State",
    "Abia State Polytechnic, Aba",
    "Covenant Polytechnic, Abayi",
    "Temple Gate Polytechnic, Abayi, Osisioma, Aba, Abia State.",
    "Uma Ukpai Polytechnic, Asaga Ohafia, Abia State",
    "Valley View Polytechnic, Ohafia Abia State",
    "Havard Wilson College of Education, Aba",
    "Rhema University",
    "Diamond College of Education Aba",
    "College of Education, Arochukwu, Abia"
  ],
  "Adamawa": [
    "Modibbo Adama University of Technology, Yola",
    "Adamawa State University Mubi",
    "American University of Nigeria, Yola",
    "Federal Polytechnic, Mubi",
    "Adamawa State Polytechnic, Yola",
    "Federal College of Education, Yola",
    "Adamawa State College of Education, Hong"
  ],
  "Akwa Ibom": [
    "University of Uyo",
    "Akwa Ibom State University, Ikot Akpaden",
    "Obong University, Obong Ntak",
    "Ritman University, Ikot Ekpene, Akwa Ibom",
    "Topfaith University, Mkpatak, Akwa Ibom State",
    "Akwa Ibom State College of Art & Science",
    "Akwa Ibom State Polytechnic",
    "Heritage Polytechnic",
    "Southern Atlantic Polytechnic",
    "Sure Foundation Polytechnic",
    "Trinity Polytechnic Uyo",
    "Federal Polytechnic Ukana"
  ],
  "Anambra": [
    "Nnamdi Azikiwe University, Awka",
    "Chukwuemeka Odumegwu Ojukwu University, Uli",
    "Madonna University, Okija",
    "Paul University, Awka",
    "Tansian University, Umunya",
    "Legacy University, Okija",
    "Peter University, Achina-Onneh",
    "Federal Polytechnic Oko",
    "Anambra State Polytechnic, Mgbakwu",
    "Nwafor Orizu College of Education, Nsugbe"
  ],
  "Bauchi": [
    "Abubakar Tafawa Balewa University, Bauchi",
    "Bauchi State University, Gadau",
    "Federal Polytechnic Bauchi, (FPTB)",
    "Abubakar Tatari Ali Polytechnic (ATAPOLY) Bauchi",
    "Sunnah College of Education",
    "Bilyaminu Othman College of Education, Dass",
    "Bogoro College of Education",
    "Climax College of Education, Bauchi",
    "Federal College of Education, Bauchi",
    "Sarkin Yama Community College of Education",
    "JIBWIS College of Education, Jama’are",
    "College of Education, Darazo",
    "College of Sharia and Arabic Studies",
    "Adamu Garkuwa College of Education, Toro",
    "Danyaya College of Education, Ningi",
    "A.D. Rufai College for Islamic and Legal Studies",
    "Bauchi Institute for Arabic and Islamic Studies",
    "Aminu Sale College of Education, Azare"
  ],
  "Bayelsa": [
    "Federal University, Otuoke",
    "Niger Delta University Yenagoa",
    "University of Africa Toru Orua",
    "Bayelsa Medical University",
    "Federal Polytechnic Ekowe",
    "Bayelsa State College of Arts and Science, Elebele",
    "Isaac Jasper Boro College of Education (COE), Sagbama"
  ],
  "Benue": [
    "University of Agriculture, Makurdi",
    "University of Health Technology, Otukpo Benue State",
    "Benue State University, Makurdi",
    "University of Mkar, Mkar",
    "Benue State Polytechnic, Ugbokolo",
    "Gboko Polytechnic",
    "The Polytechnic Otada Adoka",
    "Fidei Polytechnic, Gboko",
    "Ashi Polytechnic, Anyiin",
    "College of Education, katsina-Ala",
    "College Of Education Oju",
    "Gboko College Of Education"
  ],
  "Borno": [
    "University of Maiduguri",
    "Nigerian Army University Biu",
    "Bornu State University, Maiduguri",
    "Al-Ansar University, Maiduguri",
    "Ramat Polytechnic Maiduguri",
    "Kashim Ibrahim College of Education",
    "Muhammad Goni College of Legal and Islamic Studies (MOGOLIS)",
    "College of Education, Waka BIU",
    "Umar Ibn Ibrahim El-Kanemi College of Education, Science and Technology, Bama"
  ],
  "Cross River": [
    "University of Calabar",
    "University of Cross River State",
    "Havilla University, Nde-Ikom",
    "Arthur Javis University Akpabuyo",
    "Diamond Polytechnic",
    "Nogak Polytechnic, Ikom",
    "Cross River State Institute of Technology And Management, Ugep",
    "Bakor Polytechnic Ogoja",
    "College Of Health Technology",
    " ⁠University of Education and Entrepreneurship"
    ,
     "College of Nursing and Midwifery Calabar ",
"⁠College of Nursing and Midwifery Itigidi",
"⁠College of Nursing and Midwifery Ogoja",
    "Federal College of Education, Obudu"
  ],
  "Delta": [
    "Federal University of Petroleum Resources, Effurun",
    "Nigerian Maritime University Okerenkoko, Delta State",
    "Delta State University Abraka",
    "University of Delta, Agbor",
    "Delta University of Science and Technology, Ozoro",
    "Dennis Osadebe University, Asaba",
    "Edwin Clark University, Kaigbodo",
    "Micheal & Cecilia Ibru University",
    "Novena University, Ogume",
    "Western Delta University, Oghara Delta State",
    "Admiralty University, Ibusa Delta State",
    "Margaret Lawrence University, Umunede, Delta State",
    "Sports University, Idumuje, Ugboko, Delta State",
    "Bellmark Polytechnic, Kwale",
    "Calvary Polytechnic, Owa-Oyibo, Delta State",
    "Delta State Polytechnic, Ogwashi-Uku",
    "Delta State Polytechnic, Oghara",
    "Delta State School of Marine Technology, Burutu.",
    "Delta State College Of Health Technology, Ofuoma",
    "Petroleum Training Institute, Effurun",
    "Federal College of Education (Technical), Asaba",
    "College of Education, Edjeba Road, Warri, Delta State",
    "Delta State College of Physical Education, Mosogar",
    "School of Midwifery, Asaba",
    "Conarina School of Maritime & Transport Technology, Oria-Abraka"
  ],
  "Ebonyi": [
   
  
    "Alex Ekwueme University, Ndufu-Alike, Ebonyi State",
    "Ebonyi State University, Abakaliki",
    "King David Umahi University of Medical Sciences, Uburu, Ebony State",
    "Evangel University, Akaeze",
    "Akanu Ibiam Federal Polytechnic Unwana",
    "Savanah Institute of Technology",
    "Ebonyi State College of Education"
  ],
  "Edo": [
    "University of Benin",
    "Ambrose Alli University, Ekpoma",
    "Edo State University Uzairue",
    "Benson Idahosa University",
    "Igbinedion University Okada",
    "Samuel Adegboyega University, Ogwa.",
    "Wellspring University",
    "Mudiame University, Irrua",
    "Auchi Polytechnic, Auchi",
    "National Institute of Construction Technology",
    "Edo State Polytechnic, Use",
    "Kings Polytechnic",
    "Lighthouse Polytechnic",
    "Shaka Polytechnic",
    "Federal College of Education, Edo",
    "Nosakhare College of Education, Benin City",
    "College of Education, Ekiadolor-Benin",
    "Edo State College of Education, Igueben"
  ],
  "Ekiti": [
    "Federal University, Oye-Ekiti",
    "Ekiti State University",
    "Bamidele Olumilua University of Education, Science and Technology",
    "Afe Babalola University, Ado-Ekiti",
    "Ekiti State Polytechnic",
    "Federal Polytechnic Ado Ekiti",
    "Ajayi Polytechnic",
    "Crown Polytechnic"
  ],
  "Enugu": [
    "University of Nigeria, Nsukka",
    "Enugu State University of Science and Technology",
    "Enugu State University of Medical and Applied Sciences",
    "Caritas University",
    "Godfrey Okoye University",
    "Renaissance University",
    "Coal City University",
    "Federal Polytechnic Ohodo",
    "Institute of Management and Technology",
    "Federal College of Education, Eha-Amufu",
    "Enugu State College of Education (Technical), Enugu",
    "Osisa Tech. College of Education, Enugu",
    "African Thinkers Community of Inquiry College of Education",
    "Peaceland College of Education, Enugu",
    "The College of Education, Nsukka",
    "Elizabeth Memorial College of Education, Nsukka",
    "Institute of Ecumenical Education (Thinkers Corner)"
  ],
  "Gombe": [
  'Gombe State University, Gombe',
  'Gombe State Polytechnic Bajoga',
  'Gombe State University of Science and Technology',
  'PEN Resource University',
  'Federal University, Kashere',
  'Federal Polytechnic Kaltungo',
  'Federal College of Education (Technical), Gombe',
  'College of Education, Billiri',
  'JIBWIS College of Education, Gombe',
  'Abubakar Garba Zagada- Zagada College of Education, Bajoga',
  'Gombe State College for Legal and Islamic Studies Nafada'
  ],
  "Imo": [
    
'Federal University of Technology, Owerri',
'Imo State University, Owerri',
'Kingsley Ozumba Mbadiwe University Ogboko',
'University of Agriculture and Environmental Sciences Umuagwo',
'Hezekiah University, Umudi',
'Maranathan University, Mgbidi',
'Claretian University of Nigeria, Nekede',
'Federal Polytechnic Nekede',
'Imo State Polytechnic, Umuagwo',
'Imo State College Of Education',
'Alvan Ikoku College of Education',
'Imo State Col. of Nursing & Midwifery',
'Imo State Col. of Health and Mgt Sciences'
  ],
  "Jigawa": [
    "Federal University, Dutse",
    "Sule Lamido University, Kafin Hausa",
    "Khadija University, Majia",
    "Hussaini Adamu Federal Polytechnic",
    "Jigawa State Polytechnic",
    "Binyaminu Usman Polytechnic",
    "Jigawa State College of Education, Gumel",
    "Jigawa State College of Education and Legal Studies, Ringim",
    "Kazaure College of Education"
  ],
  "Kaduna": [
   "Ahmadu Bello University, Zaria",
   "Nigerian Defence Academy Kaduna",
   "Air Force Institute of Technology",
   "Kaduna State University, Kaduna",
   "Greenfield University, Kaduna",
   "NOK University, Kachia",
   "Airforce Institute of Technology (AFIT), NAF Base Kaduna",
 'Kaduna Polytechnic (KADPOLY)',
   'Nuhu Bamalli Polytechnic (NUBAPOLY)',
   'National Teachers Institute (NTI)',
   'Hope and Anchor College of Education',
   'Umar Bun Khatab College of Education, Tudun Nupawa, Kaduna',
   'Ameer Shehu Idris College of Advanced Studies, Zaria',
   'Kaduna State College of Education, Gidan-Waya, Kafanchan',
   'Federal College of Education, Zaria'
  ],
  "Kano": [
  "Bayero University, Kano",
  "Nigeria Police Academy Wudil",
  "Kano University of Science & Technology, Wudil",
  "Yusuf Maitama Sule University Kano",
  "Skyline University, Kano",
  "Al-Istiqama University, Sumaila",
  "Maryam Abacha American University of Nigeria",
  "Capital City University, Kano State",
  "Khalifa Isiyaku Rabiu University",
  "Baba Ahmed University",
  "Kano State Polytechnic",
  "Audu Bako School of Agriculture",
  "Kano State College of Arts, Science and Remedial Studies",
  "Kano State School of Health Technology",
  "College of Agriculture and Animal Science",
  "Federal College of Education (Technical)",
  "Kano State College of Education",
  "Aminu Kano College of Islamic and Legal Studies",
  "College of Education, Kura",
  "Kano State College of Education and Preliminary Studies",
  "Annur College of Education, Kano",
  "Dala College of Education, Kano",
  "Turath College of Education, Kano",
  "Federal College of Education, Kano",
  "Sa’adatu Rimi College of Education, Kumbotso, Kano",
  "Federal College of Education (Technical), Bichi"
  ],
  "Katsina": [
    "Federal University, Dutsin-Ma",
    "Umar Musa Yar’ Adua University",
    "Al-Qalam University, Katsina",
    "Federal Polytechnic, Daura",
    "Hassan Usman Katsina Polytechnic (HUK)",
    "Imam Saidu College of Education, Funtua",
    "Yusuf Bala Usman College of Legal and General Studies, Daura",
    "Isa Kaita College of Education, Dutsin-Ma",
    "Federal College of Education, Katsina"
  ],
  "Kebbi": [
    "Federal University, Birnin Kebbi",
    "Kebbi State University of Science and Technology",
    "Waziri Umaru Federal Polytechnic (WUFPBK)",
    "Kebbi State Polytechnic (KESPODAK)",
    "Adamu Augie College of Education, Argungu"
  ],
  "Kogi": [
    "Kogi State College of Education, Kabba",
    "Al-Hikma College Of Education, Ankpa",
    "Kogi East College of Education",
    "Peace College Of Education, Ankpa",
    "Federal College of Education, Okene",
    "Kogi State College of Education, Ankpa",
    "Federal University, Lokoja",
    "Kogi State University Anyigba",
    "Confluence University of Science and Technology (CUSTECH)",
    "Salem University, Lokoja",
    "Federal Polytechnic Idah",
    "Kogi State Polytechnic",
    "Prime Polytechnic"
  ],
  "Kwara": [
   "Federal Polytechnic Offa",
"Kwara State Polytechnic",
"Graceland Polytechnic",
"Lens Polytechnic",
"The Polytechnic, Igbo-Owu",
"University of Ilorin",
"Kwara State University, Ilorin",
" Al-Hikmah University, Ilorin",
" Landmark University, Omu-Aran",
"Summit University",
" Crown Hill University Eiyenkorin",
"Thomas Adewumi University, Oko-Irese",
"Ahman Pategi University",
"University of Offa",
"Muhyideen College of Education, Ilorin",
"Kinsey College of Education, Ilorin, ",
" ECWA College of Education, Igbaja",
"PAN African College of Education, Offa",
"College of Education, Moro, Ife-North",
"College of Education, Ilemona",
"Adesina College of Education, Share",
"Moje College of Education, Erin-Ile",
"Imam Hamzat College of Education, Ilorin",
" Gand-Plus College of Education",
"Kwara State College of Education, Oro",
"Kwara State College of Education (Technical), Lafiagi",
" Kwara State College of Education, Ilorin",
" Nigerian Army School of Education (NASE), Ilorin"
  ],
  "Lagos": [
    "University of Lagos",
    "Lagos State University",
    "Lagos State University of Education",
    "Augustine University",
    "Caleb University, Lagos",
    "Pan-Atlantic University, Lagos",
    "Anchor University Ayobo",
    "Eko University of Medical and Health Sciences Ijanikin",
    "James Hope University, Lagos",
    "Yaba College of Technology",
    "Lagos State Polytechnic",
    "Grace Polytechnic, Surulere",
    "Kalac Christal Polytechnic, Sangotedo, Lekki",
    "Lagos City Polytechnic, Ikeja",
    "Ronik Polytechnic, Ejigbo",
    "Corner Stone College of Education, Ikeja",
    "Bayo Tijani College of Education",
    "Upland College of Education, Badagry",
    "Corona College of Education, Lekki",
    "Nana Aishat Memorial College of Education",
    "Topmost College of Education, Ipaja-Agbado",
    "Royal College of Education, Ikeja",
    "African Church College of Education",
    "Meadow Hall College of Education",
    "Raphat College of Education",
    "Adeniran Ogunsanya College of Education, Otto/Ijanikin",
    "Federal College of Education (Technical), Akoka",
    "Ansar-Ud-Deen College of Education, Isolo",
    "Michael Otedola College of Primary Education, Lagos",
    "St. Augustine College of Education Akoka"
  ],
  "Nasarawa": [
    "Federal University, Lafia",
    "Nasarawa State University Keffi",
    "Ave Maria University, Piyanko",
    "Mewar University, Masaka",
    "Isa Mustapha Agwai Polytechnic Lafia",
    "Nasarawa State College of Agriculture and Technology",
    "Al-Hikma Polytechnic",
    "Nacabs Polytechnic",
    "Federal Polytechnic Nasarawa",
    "Hill College of Education, Gwanje, Akwanga",
    "Ipere College of Education, Agyaragu",
    "Metro College of Education, Adogi-Lafia",
    "JIBWIS College of Education, Keffi",
    "Innovative College of Education, Karu"
  ],
  "Niger": [
    "Federal University of Technology, Minna",
    "Ibrahim Badamasi Babangida University, Lapai",
    "Edusoko University, Bida",
    "Newgate University, Minna",
    "Niger State Polytechnic",
    "St. Mary Polytechnic",
    "Federal Polytechnic Bida",
    "Federal College of Education, Kontagora",
    "Niger State College of Education, Minna"
  ],
  "Ogun": [
    "Yewa Central College of Education, Ayetoro, Abeokuta",
    "Royal City College of Education, Iyesi-Ota",
    "Awori District College of Education",
    "Piaget College of Education",
    "Good Shepperd College of Education",
    "Tai Solarin College of Education, Ijebu-Ode",
    "Federal College of Education, Abeokuta",
    "Federal University of Agriculture, Abeokuta",
    "Olabisi Onabanjo University, Ago Iwoye",
    "Tai Solarin University of Education Ijebu Ode",
    "Moshood Abiola University of Science and Technology Abeokuta",
    "Babcock University, Ilishan-Remo",
    "Bells University of Technology, Otta",
    "Chrisland University",
    "Covenant University Ota",
    "Crawford University Igbesa",
    "Hallmark University, Ijebi Itele",
    "Mcpherson University, Seriki Sotayo, Ajebo",
    "Southwestern University, Oku Owa",
    "Christopher University Mowe",
    "Mountain Top University",
    "Trinity University Ogun State",
    "Federal Polytechnic Ilaro",
    "Ogun State Polytechnic",
    "Ogun State Institute of Technology",
    "Allover Central Polytechnic",
    "Landmark Polytechnic",
    "Redeemers College of Technology and Management",
    "Speedway Polytechnic",
    "Stars Polytechnic",
    "Abraham Adesanya Polytechnic",
    "D.S. Adegbenro ICT Polytechnic",
    "Moshood Abiola Polytechnic",
    "Gateway Polytechnic"
  ],
  "Ondo": [
    "Rufus Giwa Polytechnic",
    "Best Solution Polytechnic",
    "Global Polytechnic",
    "Federal Polytechnic Ile-Oluji",
    "Federal University of Technology, Akure",
    "Adekunle Ajasin University, Akungba",
    "Ondo State University of Science and Technology Okitipupa",
    "Ondo State University of Medical Sciences",
    "Achievers University, Owo",
    "Elizade University, Ilara-Mokin",
    "Wesley University. of Science & Technology, Ondo",
    "Festmed College of Education, Ondo State",
    "Bethel College of Education Ijare, Ondo",
    "College of Education, Ero-Akure",
    "Folrac Fortified College of Education, Ondo",
    "Adeyemi College of Education, Ondo",
    "Olekamba College of Education"
  ],
  "Osun": [
    "Assanusiya College of Education, Odeomu",
    "Crestfield College of Education",
    "Grace College of Education",
    "Federal College of Education, Osun",
    "Ilori College of Education, Ede",
    "Hamzainab College of Education, Oshogbo",
    "Osun State College of Education, Ilesa",
    "College of Education, Ila-Orangun, Osun",
    "Obafemi Awolowo University, Ile-Ife",
    "Osun State University Osogbo",
    "Adeleke University, Ede",
    "Bowen University, Iwo",
    "Fountain Unveristy, Oshogbo",
    "Joseph Ayo Babalola University, Ikeji-Arakeji",
    "Kings University, Ode Omu",
    "Oduduwa University, Ipetumodu",
    "Redeemer’s University, Ede",
    "Westland University Iwo",
    "Federal Polytechnic Ede",
    "Osun State College of Technology",
    "Osun State Polytechnic (OSPOLY), Iree",
    "College of Technology, Iresi",
    "Igbajo Polytechnic, Igbajo",
    "Interlink Polytechnic, Ijebu-Jesa",
    "The Polytechnic, Ile Ife",
    "The Polytechnic, Imesi-Ile",
    "Wolex Polytechnic, Iwo"
  ],
  "Oyo": [
    "Novelty Polytechnic Kishi",
    "Saf Polytechnic",
    "Tower Polytechnic, Ibadan",
    "Federal Polytechnic Ayede",
    "Adeseun Ogundoyin Polytechnic",
    "Oke-Ogun Polytechnic",
    "Oyo State College of Agriculture and Technology",
    "Bolmor Polytechnic",
    "Ibadan City Polytechnic",
    "The Polytechnic Ibadan",
    "University of Ibadan",
    "Ladoke Akintola University of Technology, Ogbomoso",
    "Oyo State Technical University Ibadan",
    "Ajayi Crowther University, Ibadan",
    "Lead City University, Ibadan",
    "Kola Daisi University Ibadan",
    "Dominican University Ibadan",
    "Precious Cornerstone University",
    "Atiba University Oyo",
    "Dominion University Ibadan",
    "Murtadha College of Education, Olodo",
    "Al-Ibadan College of Education",
    "College of Education, Lanlate",
    "Emamo College of Education",
    "Federal College of Education (Special)",
    "Delar College of Education",
    "Emmanuel Alayande College of Education"
  ],
  "Plateau": [
    "University of Jos",
    "Karl-Kumm University, Vom, Plateau State",
    "Anan University, Kwall",
    "Plateau State University Bokkos",
    "Federal Polytechnic N’yak, Shendam",
    "Plateau State Polytechnic",
    "ECWA College of Education, Jos",
    "Global College of Education, Bukuru",
    "Oswald Waller College of Education, Shendam",
    "Abdullahi Maikano College of Education, Wase",
    "College of Education, Gindiri",
    "Federal College of Education, Pankshin"
  ],
  "Rivers": [
    "Federal College of Education (Technical), Omoku",
    "University of Port-Harcourt",
    "Ignatius Ajuru University of Education,Rumuolumeni",
    "River State University",
    "Rhema University, Obeama-Asa",
    "PAMO University of Medical Sciences",
    "Ken Sarowiwa Polytechnic",
    "Port-Harcourt Polytechnic",
    "Eastern Polytechnic",
    "Federal Polytechnic of Oil and Gas Bonny"
  ],
  "Sokoto": [
    "Usumanu Danfodiyo University",
    "Sokoto State University",
    "Shehu Shagari University of Education",
    "Saisa University of Medical Sciences and Technology",
    "NorthWest University",
    "Umaru Ali Shinkafi Polytechnic",
    "Shehu Shagari College of Education",
    "Biga College of Education",
    "Federal College of Education"
  ],
  "Taraba": [
    "Federal University, Wukari",
    "Kwararafa University, Wukari",
    "Taraba State University, Jalingo",
    "Federal Polytechnic Bali",
    "Taraba State Polytechnic",
    "College of Education, Zing",
    "Peacock College of Education, Jalingo"
  ],
  "Yobe": [
    "Federal College of Education (Technical), Potiskum",
    "College of Education, Gashua, Damaturu",
    "Umar Suleiman College Of Education, Gashua",
    "Islamic College of Education, Potiskum",
    "College of Education and Legal Studies",
    "Federal University Gashua",
    "Yobe State University, Damaturu",
    "Federal Polytechnic Damaturu",
    "Mai-Idris Alooma Polytechnic"
  ],
  "Zamfara": [
    "Zamfara State College of Arts and Science",
    "Federal Polytechnic Kaura Namoda",
    "Abdu Gusau Polytechnic",
    "Federal University, Gusau",
    "Zamfara State University",
    "Federal College of Education (Technical), Gusau",
    "Zamfara State College of Education, Maru"
  ],
  "FCT Abuja": [
    "Angel Crown College of Education",
    "Sam Ale College of Education",
    "FCT College of Education, Zuba",
    "City College of Education, Mararaba",
    "University of Abuja, Gwagwalada",
    "African University of Science & Technology",
    "Baze University",
    "Bingham University, New Karu",
    "Nile University of Nigeria",
    "Veritas University, Abuja",
    "Philomath University, Kuje",
    "European University of Nigeria, Duboyi",
    "Citi Polytechnic",
    "Dorben Polytechnic"
  ]
};

// ============================================================================

// fill registration fee UI if present
try { document.getElementById('registration-fee').textContent = REGISTRATION_FEE_NGN; } catch(e){}

// DOM refs (keeps your UI)
const stateSelect = document.getElementById('state-select');
const schoolSelect = document.getElementById('school-select');
const assocSelect = document.getElementById('assoc-select');
const assocAddBtn = document.getElementById('assoc-add-btn');
const assocNewInput = document.getElementById('assoc-new-input');

const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview'); // optional in your markup
const imageName = document.getElementById('image-name');

const yearSelect = document.getElementById('year-held');

const tabSignup = document.getElementById('tab-signup');
const tabLogin = document.getElementById('tab-login');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const panelTitle = document.getElementById('panel-title');

// small helper modal (injected) for loading/success/error
const modal = createModal();
document.body.appendChild(modal.el);

// ---------- firebase helpers: wait for compat SDK and init ----------
let USE_FIREBASE = false;
let firebaseInited = false;
let auth = null, db = null;

async function waitForFirebaseSDK(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.firebase && window.firebase.auth && window.firebase.firestore) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

(async function initFirebaseIfAvailable() {
  const ok = await waitForFirebaseSDK(6000);
  if (!ok) {
    console.warn('Firebase compat SDK not detected within timeout. Script will still work without Firebase (server flow).');
    return;
  }
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    USE_FIREBASE = true;
    firebaseInited = true;
    console.log('Firebase initialized (compat).');
  } catch (err) {
    console.warn('Firebase init error:', err);
  }
})();

// ---------- populate states & years (keeps your object) ----------
// ---------- populate states & years (robust, runs after DOM ready) ----------
(function initStateSchoolAndYear() {
  function setup() {
    // DOM refs (may be defined earlier but re-query to be safe)
    const stateSel = document.getElementById('state-select');
    const schoolSel = document.getElementById('school-select');
    const yearSel = document.getElementById('year-held');

    if (!stateSel || !schoolSel || !yearSel) {
      console.warn('State/school/year selects not found in DOM yet.');
      return;
    }

    // Populate states (only once)
    if (stateSel.options.length <= 1) { // leave the default "Select state" intact
      Object.keys(stateSchools).sort().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        stateSel.appendChild(opt);
      });
    }

    // Populate year list (only once)
    if (yearSel.options.length <= 1) {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear; y >= 1950; y--) {
        const o = document.createElement('option'); o.value = y; o.textContent = y;
        yearSel.appendChild(o);
      }
    }

    // Ensure school select has a default option and is disabled by default
    schoolSel.innerHTML = '<option value="">Select school</option>';
    schoolSel.disabled = true;

    // Populate schools for a given state value
    function populateSchoolsForState(state) {
      schoolSel.innerHTML = '<option value="">Select school</option>';
      if (state && stateSchools[state]) {
        stateSchools[state].forEach(s => {
          const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
          schoolSel.appendChild(opt);
        });
        schoolSel.disabled = false;
      } else {
        schoolSel.disabled = true;
      }

      // After changing school list, reload associations (keeps your behavior)
      if (typeof loadAssociationsForSchool === 'function') {
        try { loadAssociationsForSchool(); } catch (err) { console.warn('loadAssociationsForSchool error', err); }
      }
    }

    // Attach change handler (avoid dupes)
    stateSel.removeEventListener('change', stateSel._campusChangeHandler);
    const handler = () => populateSchoolsForState(stateSel.value);
    stateSel.addEventListener('change', handler);
    // store reference so we can remove if needed
    stateSel._campusChangeHandler = handler;

    // If a state is preselected (e.g., from server or form repopulation), populate immediately
    if (stateSel.value) {
      populateSchoolsForState(stateSel.value);
    }
  }

  // Run setup when DOM is ready (handles defer vs inline script cases)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    // DOM already ready
    setTimeout(setup, 0);
  }
})();


// when state changes, populate schools
stateSelect.addEventListener('change', () => {
  const state = stateSelect.value;
  schoolSelect.innerHTML = '<option value="">Select school</option>';
  if (state && stateSchools[state]) {
    stateSchools[state].forEach(s => {
      const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
      schoolSelect.appendChild(opt);
    });
    schoolSelect.disabled = false;
  } else {
    schoolSelect.disabled = true;
  }
  // clear/reload associations for the selected school
  assocSelect.innerHTML = '<option value="">Select association (or Add new)</option>';
  loadAssociationsForSchool();
});

// associations stored in localStorage (preserve your behavior)
const STORAGE_ASSOC_KEY = 'campus_assoc_list_v1';
function loadAssociationsLocal() {
  let arr = JSON.parse(localStorage.getItem(STORAGE_ASSOC_KEY) || '[]');
  if (arr.length === 0) {
    arr = ['Student Union', 'Debate Club', 'Basketball Club', 'Science Club'];
    localStorage.setItem(STORAGE_ASSOC_KEY, JSON.stringify(arr));
  }
  return arr;
}
function populateAssocSelectWithLocal() {
  const arr = loadAssociationsLocal();
  assocSelect.innerHTML = '<option value="">Select association (or Add new)</option>';
  arr.forEach(a => {
    const opt = document.createElement('option'); opt.value = a; opt.textContent = a;
    assocSelect.appendChild(opt);
  });
}
populateAssocSelectWithLocal();

// ---------- Robust association saving and UI handlers (updated) ----------

/**
 * Wait until Firebase init is ready (USE_FIREBASE && db) or timeout.
 * Resolves true if ready, false on timeout.
 */
async function waitForFirebaseReady(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (typeof USE_FIREBASE !== 'undefined' && USE_FIREBASE && typeof db !== 'undefined' && db) {
      return true;
    }
    await new Promise(r => setTimeout(r, 120));
  }
  return false;
}

/**
 * Save association to Firestore when Firebase becomes available.
 * If Firebase is not ready it will retry a few times.
 */
async function saveAssociationToFirestore(name, opts = {}) {
  if (!name) return;
  const stateName = opts.state ?? (typeof stateSelect !== 'undefined' ? stateSelect.value || null : null);
  const schoolName = opts.school ?? (typeof schoolSelect !== 'undefined' ? schoolSelect.value || null : null);

  const ready = await waitForFirebaseReady(8000);
  if (!ready) {
    // Retry later (non-blocking) — useful if user added association before Firebase finished initializing
    console.warn('Firebase not ready yet — will retry saving association in 2s.');
    setTimeout(() => saveAssociationToFirestore(name, opts), 2000);
    return;
  }

  try {
    await db.collection('associations').add({
      name,
      stateName: stateName || null,
      schoolName: schoolName || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('Association saved to Firestore:', name);
  } catch (err) {
    console.warn('Failed to save association to Firestore:', err);
    // Optional: retry once after short delay on transient errors
    setTimeout(() => {
      db.collection && db.collection('associations').add({
        name,
        stateName: stateName || null,
        schoolName: schoolName || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => console.log('Retry save succeeded for association:', name))
        .catch(e => console.warn('Retry failed for saveAssociationToFirestore:', e));
    }, 3000);
  }
}

// Replace assocAddBtn click handler (keeps same toggle UX)
try {
  assocAddBtn && assocAddBtn.addEventListener('click', () => {
    assocNewInput.classList.toggle('hidden');
    if (!assocNewInput.classList.contains('hidden')) assocNewInput.focus();
  });
} catch (e) { console.warn('assocAddBtn wiring error', e); }

// Handle Enter on assocNewInput: save locally + attempt Firestore persist
try {
  assocNewInput && assocNewInput.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const name = assocNewInput.value.trim();
    if (!name) {
      alert('Please type the association name');
      return;
    }

    // Save locally (existing behavior)
    const arr = JSON.parse(localStorage.getItem(STORAGE_ASSOC_KEY) || '[]');
    if (!arr.includes(name)) {
      arr.push(name);
      localStorage.setItem(STORAGE_ASSOC_KEY, JSON.stringify(arr));
    }

    // Refresh the select (local first)
    populateAssocSelectWithLocal();
    assocSelect.value = name;
    assocNewInput.value = '';
    assocNewInput.classList.add('hidden');

    // Attempt to persist to Firestore (non-blocking). This will wait for Firebase init if needed.
    saveAssociationToFirestore(name, { state: stateSelect?.value || null, school: schoolSelect?.value || null })
      .catch(err => console.warn('saveAssociationToFirestore uncaught error:', err));

    // If school is selected, reload associations from Firestore to include any server-side entries
    try { loadAssociationsForSchool(); } catch (err) { /* ignore */ }
  });
} catch (e) { console.warn('assocNewInput wiring error', e); }

// small accessibility: close assoc input on escape
assocNewInput && assocNewInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') assocNewInput.classList.add('hidden'); });

// image preview
let imageFileDataUrl = null;
imageInput && imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) {
    if (imagePreview) { imagePreview.classList.add('hidden'); imagePreview.src = ''; }
    imageName.textContent = '';
    imageFileDataUrl = null;
    return;
  }
  imageName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (imagePreview) {
      imagePreview.src = ev.target.result;
      imagePreview.classList.remove('hidden');
    }
    imageFileDataUrl = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// tab toggles (preserve your UI)
tabSignup && tabSignup.addEventListener('click', () => {
  signupForm.classList.remove('hidden'); loginForm.classList.add('hidden');
  tabSignup.classList.add('bg-two','text-white'); tabLogin.classList.remove('bg-two','text-white');
  panelTitle.textContent = 'Sign up';
});
tabLogin && tabLogin.addEventListener('click', () => {
  signupForm.classList.add('hidden'); loginForm.classList.remove('hidden');
  tabLogin.classList.add('bg-two','text-white'); tabSignup.classList.remove('bg-two','text-white');
  panelTitle.textContent = 'Login';
});

// simple error helper
function showError(msg) { alert(msg); }

// Paystack checkout (keeps existing flow)
function payWithPaystack(email, amountNGN, metadata = {}, onSuccess, onClose) {
  if (!window.PaystackPop) {
    showError('Paystack script not loaded.');
    return;
  }
  const handler = PaystackPop.setup({
    key: PAYSTACK_KEY,
    email,
    amount: amountNGN * 100,
    currency: 'NGN',
    metadata: {
      custom_fields: [{ display_name: "Registration fee", variable_name: "reg_fee", value: `${amountNGN}` }],
      ...metadata
    },
    callback: function(response){ onSuccess && onSuccess(response); },
    onClose: function(){ onClose && onClose(); }
  });
  handler.openIframe();
}

// ---------- UPLOAD to Uploadcare (replaces Imgur) ----------
async function uploadImageToUploadcare(file) {
  if (!UPLOADCARE_PUBLIC_KEY) throw new Error('Uploadcare public key not set');
  const form = new FormData();
  form.append('file', file);
  form.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
  form.append('UPLOADCARE_STORE', '1'); // store and make available on CDN

  const resp = await fetch(UPLOADCARE_BASE_UPLOAD, {
    method: 'POST',
    body: form
  });

  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || data?.detail || data?.message || JSON.stringify(data);
    throw new Error('Uploadcare upload failed: ' + msg);
  }

  // data.file contains uuid/path. Build CDN URL.
  const fileId = (data && data.file) ? String(data.file).replace(/^\/+|\/+$/g, '') : null;
  if (!fileId) throw new Error('Uploadcare did not return file id');
  // Ensure trailing slash for consistent usage
  const cdnUrl = `${UPLOADCARE_CDN.replace(/\/+$/,'')}/${fileId}/`;
  return cdnUrl;
}

// helpers to find state/school docs by name (optional, non-destructive)
async function findStateDocByName(name) {
  if (!USE_FIREBASE) return null;
  const q = await db.collection('states').where('name', '==', name).limit(1).get();
  return q.empty ? null : { id: q.docs[0].id, data: q.docs[0].data() };
}
async function findSchoolDocByName(name) {
  if (!USE_FIREBASE) return null;
  const q = await db.collection('schools').where('name', '==', name).limit(1).get();
  return q.empty ? null : { id: q.docs[0].id, data: q.docs[0].data() };
}

// load associations for selected school (merge local + Firestore)
async function loadAssociationsForSchool() {
  populateAssocSelectWithLocal();
  if (!USE_FIREBASE || !db) return;
  const schoolName = schoolSelect.value || null;
  if (!schoolName) return;
  try {
    const snapshot = await db.collection('associations').where('schoolName', '==', schoolName).orderBy('createdAt', 'desc').limit(100).get();
    snapshot.forEach(doc => {
      const d = doc.data();
      const already = Array.from(assocSelect.options).some(o => o.value === d.name);
      if (!already) {
        const opt = document.createElement('option'); opt.value = d.name; opt.textContent = d.name;
        assocSelect.appendChild(opt);
      }
    });
  } catch (err) { console.warn('Failed loading associations from Firestore', err); }
}
schoolSelect && schoolSelect.addEventListener('change', loadAssociationsForSchool);

// ---------- SIGNUP handler (email + password ONLY) ----------
// ---------- SIGNUP handler (payment first, with email-exists pre-check + friendly handling) ----------
signupForm && signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(signupForm);
  const required = ['firstName','lastName','username','email','phone','state','school','password','confirmPassword'];
  for (const k of required) {
    if (!fd.get(k) || fd.get(k).toString().trim() === '') return showError('Please fill all required fields.');
  }
  if (fd.get('password') !== fd.get('confirmPassword')) return showError('Passwords do not match.');

  const payload = {
    firstName: fd.get('firstName').trim(),
    lastName: fd.get('lastName').trim(),
    username: fd.get('username').trim(),
    email: fd.get('email').trim(),
    phone: fd.get('phone').trim(),
    state: fd.get('state'),
    school: fd.get('school'),
    association: fd.get('association') || '',
    position: fd.get('position') || '',
    positionDetails: fd.get('positionDetails') || '',
    yearHeld: fd.get('yearHeld') || '',
    password: fd.get('password'),
    imageDataUrl: imageFileDataUrl || null
  };
    // --- ensure association is persisted (local + Firestore) at signup time ---
  (function ensureAssociationSavedAtSignup() {
    try {
      const typed = assocNewInput?.value?.trim();
      const picked = assocSelect?.value?.trim();

      // If the user typed a new association in the add input, prefer that
      if (typed) {
        // save locally if missing (keeps previous behavior)
        const arr = JSON.parse(localStorage.getItem(STORAGE_ASSOC_KEY) || '[]');
        if (!arr.includes(typed)) {
          arr.push(typed);
          localStorage.setItem(STORAGE_ASSOC_KEY, JSON.stringify(arr));
        }
        // update UI select so it reflects the new value
        populateAssocSelectWithLocal();
        assocSelect.value = typed;
        // set payload association to typed value
        payload.association = typed;

        // attempt to persist to Firestore (non-blocking). This will wait for Firebase init if needed.
        saveAssociationToFirestore(typed, { state: payload.state || null, school: payload.school || null })
          .catch(err => console.warn('saveAssociationToFirestore uncaught error at signup:', err));
      } else if (picked) {
        // user selected an existing association from the select
        payload.association = picked;
        // ensure it's present in Firestore too (idempotent)
        saveAssociationToFirestore(picked, { state: payload.state || null, school: payload.school || null })
          .catch(err => console.warn('saveAssociationToFirestore uncaught error at signup:', err));
      } else {
        payload.association = '';
      }
    } catch (e) {
      console.warn('ensureAssociationSavedAtSignup failed', e);
      // fall back: keep whatever payload.association already is
      payload.association = payload.association || '';
    }
  })();


  // Helper to show a modal offering login/reset options when email exists
  function showEmailExistsOptions(email, message) {
    modal.showError(message || 'An account already exists for this email.');
    modal.addActionButton('Go to Login', () => { window.location.href = '/login.html'; });
    modal.addActionButton('Reset Password', async () => {
      if (!USE_FIREBASE || !auth) {
        modal.showError('Password reset requires Firebase to be available.');
        return;
      }
      try {
        modal.showLoading('Sending reset email...');
        await auth.sendPasswordResetEmail(email);
        modal.showSuccess('Password reset email sent. Check your inbox.');
      } catch (err) {
        console.error('sendPasswordResetEmail error', err);
        modal.showError('Could not send reset email: ' + (err && err.message ? err.message : 'Please try again later.'));
      }
    });
  }

  // If Firebase available, pre-check if email already has an account (avoids charging)
  if (USE_FIREBASE && auth && db && typeof auth.fetchSignInMethodsForEmail === 'function') {
    try {
      modal.showLoading('Checking email...');
      const methods = await auth.fetchSignInMethodsForEmail(payload.email);
      modal.hide();
      if (methods && methods.length > 0) {
        // Email already registered — show friendly instructions and stop
        showEmailExistsOptions(payload.email, 'This email already has an account — please login or reset your password.');
        return;
      }
    } catch (err) {
      // Non-fatal: if the pre-check fails (network/etc), we continue to payment but log the error
      console.warn('Email pre-check failed, proceeding to payment:', err);
      modal.hide();
    }
  }

  // If Firebase is available, use pay-first -> create user flow
  if (USE_FIREBASE && auth && db) {
    try {
      modal.showLoading('Opening payment window...');
      payWithPaystack(payload.email, REGISTRATION_FEE_NGN, { userEmail: payload.email }, async (resp) => {
        modal.showLoading('Payment succeeded — creating account...');

        let uid = null;
        try {
          // create Firebase auth user
          const userCred = await auth.createUserWithEmailAndPassword(payload.email, payload.password);
          const user = userCred.user;
          uid = user.uid;

          // upload image (optional)
          let imageUrl = null;
          if (imageInput.files && imageInput.files[0]) {
            try {
              modal.showLoading('Uploading profile image...');
              imageUrl = await uploadImageToUploadcare(imageInput.files[0]);
            } catch (err) {
              console.warn('Uploadcare upload failed (continuing):', err);
            }
          }

          // update Firebase profile
          try {
            const displayName = `${payload.firstName} ${payload.lastName}`;
            await user.updateProfile({ displayName, photoURL: imageUrl || null });
          } catch (err) { console.warn('updateProfile failed:', err); }

          // find state/school docs (non-blocking)
          let stateDoc = null, schoolDoc = null;
          try { stateDoc = await findStateDocByName(payload.state); } catch(e){/*ignore*/ }
          try { schoolDoc = await findSchoolDocByName(payload.school); } catch(e){/*ignore*/ }

          // create user document with paymentStatus: 'paid'
          modal.showLoading('Saving profile...');
          const userDoc = {
            uid,
            firstName: payload.firstName,
            lastName: payload.lastName,
            username: payload.username || null,
            email: payload.email,
            phone: payload.phone || null,
            stateName: payload.state || null,
            schoolName: payload.school || null,
            stateId: stateDoc ? stateDoc.id : null,
            schoolId: schoolDoc ? schoolDoc.id : null,
            association: payload.association || null,
            position: payload.position || null,
            positionDetails: payload.positionDetails || null,
            yearHeld: payload.yearHeld || null,
            imageUrl: imageUrl || null,
            paymentStatus: 'paid',
            paymentReference: resp.reference || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          await db.collection('users').doc(uid).set(userDoc);

          // record payment
          try {
            await db.collection('payments').add({
              uid,
              email: payload.email,
              amount: REGISTRATION_FEE_NGN,
              reference: resp.reference,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          } catch (err) {
            console.warn('Failed to record payment in payments collection:', err);
          }

          // optional server notify
          if (SAVE_USER_ENDPOINT && SAVE_USER_ENDPOINT !== '/api/auth/register') {
            try {
              await fetch(SAVE_USER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: resp.reference, uid, email: payload.email })
              });
            } catch (err) {
              console.warn('Optional SAVE_USER_ENDPOINT failed:', err);
            }
          }

          modal.showSuccess('Registration complete — payment verified.');
          modal.addActionButton('Go to dashboard', () => { window.location.href = '/dashboard.html'; });

        } catch (err) {
          console.error('Error creating account after payment:', err);

          // If email already in use (rare if pre-check succeeded), show friendly options and include payment reference
          if (err && err.code === 'auth/email-already-in-use') {
            const message = 'This email is already in use. If you intended to join, please login or reset your password. If you already paid, contact support with reference: ' + (resp && resp.reference ? resp.reference : 'unknown');
            showEmailExistsOptions(payload.email, message);
            // Also try to persist a minimal payment record for reconciliation
            try {
              await db.collection('payments').add({
                uid: null,
                email: payload.email,
                amount: REGISTRATION_FEE_NGN,
                reference: resp.reference || null,
                note: 'Payment succeeded but account creation failed (email already exists). Manual reconciliation required.',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            } catch (e) {
              console.warn('Failed to save fallback payment record:', e);
            }
            return;
          }

          const msg = (err && err.message) ? err.message : 'Failed to create account after payment. Contact support with payment reference: ' + (resp && resp.reference ? resp.reference : 'unknown');
          modal.showError(msg);

          // fallback: save minimal payment record for reconciliation
          try {
            await db.collection('payments').add({
              uid: uid || null,
              email: payload.email,
              amount: REGISTRATION_FEE_NGN,
              reference: resp.reference || null,
              note: 'Payment succeeded but account creation failed — manual reconciliation may be required.',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          } catch (e) { console.warn('Failed to save fallback payment record:', e); }
        }
      }, () => {
        modal.showError('Payment window closed. Registration not completed.');
      });

    } catch (err) {
      console.error('Unexpected error during signup/payment flow:', err);
      modal.showError(err && err.message ? err.message : 'Signup failed. Please try again.');
    }
    return;
  }

  // Non-Firebase fallback remains the same (pay-first -> server-save)
  payWithPaystack(payload.email, REGISTRATION_FEE_NGN, { user: payload }, async (resp) => {
    try {
      const res = await fetch(SAVE_USER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: resp.reference, user: payload })
      });
      if (!res.ok) {
        const t = await res.text();
        showError('Payment succeeded but saving user failed: ' + t);
        return;
      }
      alert('Registration complete! Payment verified and account created.');
      window.location.href = '/dashboard.html';
    } catch (err) {
      console.error(err);
      showError('Payment succeeded but could not contact the server to save the account. Check network/server logs.');
    }
  }, () => {
    alert('Payment window closed. You can retry to complete registration.');
  });
});


// ---------- LOGIN handler (email + password only) ----------
loginForm && loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const email = fd.get('loginId')?.toString().trim();
  const password = fd.get('loginPassword')?.toString().trim();
  if (!email || !password) return showError('Please enter email and password.');

  // require firebase for login
  if (!USE_FIREBASE || !auth) {
    return showError('Login requires Firebase to be initialized.');
  }

  try {
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    // successful login -> redirect based on admin list
    try {
      const userEmail = (userCred.user && userCred.user.email) ? userCred.user.email.toLowerCase() : (email || '').toLowerCase();
      if (ADMIN_EMAILS.includes(userEmail)) {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/dashboard.html';
      }
    } catch (redirErr) {
      console.warn('Redirect decision failed, falling back to dashboard', redirErr);
      window.location.href = '/dashboard.html';
    }
  } catch (err) {
    console.error('Login error:', err);
    const code = err.code || '';
    if (code === 'auth/wrong-password') return showError('Incorrect password.');
    if (code === 'auth/user-not-found') return showError('No account found for this email.');
    return showError(err.message || 'Sign-in failed.');
  }
});

// ---------- SIGN OUT helper ----------
async function signOutNow() {
  if (USE_FIREBASE && auth) {
    try {
      await auth.signOut();
    } catch (err) { console.warn('Sign out error:', err); }
  } else {
    localStorage.removeItem('auth_token');
  }
  // redirect to landing page after sign out
  window.location.href = '/index.html';
}
// attach to menu sign-out (try to find by text matching)
document.addEventListener('click', (ev) => {
  const el = ev.target;
  if (!el) return;
  if ((el.matches && el.matches('a')) || (el.closest && el.closest('a'))) {
    const a = el.matches('a') ? el : el.closest('a');
    if (a && /sign\s?out/i.test(a.textContent || '')) {
      ev.preventDefault();
      signOutNow();
    }
  }
});

// ---------- small helpers: modal, etc. ----------
function createModal() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.left = 0;
  overlay.style.top = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;
  overlay.style.backdropFilter = 'blur(3px)';

  const card = document.createElement('div');
  card.style.background = 'white';
  card.style.padding = '20px';
  card.style.borderRadius = '12px';
  card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
  card.style.maxWidth = '420px';
  card.style.width = '90%';
  card.style.textAlign = 'center';
  const title = document.createElement('div'); title.style.fontWeight = 700; title.style.marginBottom = '8px';
  const body = document.createElement('div'); body.style.fontSize = '14px'; body.style.color = '#374151'; body.style.marginBottom = '12px';
  const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'center'; actions.style.gap = '8px';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '8px 12px';
  closeBtn.style.borderRadius = '8px';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => hide());

  actions.appendChild(closeBtn);
  card.appendChild(title); card.appendChild(body); card.appendChild(actions);
  overlay.appendChild(card);

  function showLoading(message = 'Loading...') {
    title.textContent = 'Please wait';
    body.textContent = message;
    actions.innerHTML = '';
    actions.appendChild(closeBtn);
    overlay.style.display = 'flex';
  }
  function showSuccess(message = 'Success') {
    title.textContent = 'Success';
    body.textContent = message;
    actions.innerHTML = '';
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.style.padding = '8px 12px';
    ok.style.borderRadius = '8px';
    ok.style.border = 'none';
    ok.style.cursor = 'pointer';
    ok.addEventListener('click', () => hide());
    actions.appendChild(ok);
    overlay.style.display = 'flex';
  }
  function showError(message = 'Error') {
    title.textContent = 'Error';
    body.textContent = message;
    actions.innerHTML = '';
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.style.padding = '8px 12px';
    ok.style.borderRadius = '8px';
    ok.style.border = 'none';
    ok.style.cursor = 'pointer';
    ok.addEventListener('click', () => hide());
    actions.appendChild(ok);
    overlay.style.display = 'flex';
  }
  function hide() { overlay.style.display = 'none'; }
  function addActionButton(text, cb) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '8px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', cb);
    actions.appendChild(btn);
    overlay.style.display = 'flex';
    return btn;
  }

  return { el: overlay, showLoading, showSuccess, showError, hide, addActionButton };
}

// expose helper
window.CampusLeaders = window.CampusLeaders || {};
window.CampusLeaders.signOutNow = signOutNow;
window.CampusLeaders.findUsersByAssociation = async function(associationName) {
  if (!USE_FIREBASE || !db) return [];
  const q = await db.collection('users').where('association', '==', associationName).get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
};
// expose admin emails for admin console (lowercase)
window.CampusLeaders.ADMIN_EMAILS = ADMIN_EMAILS.map(e=>e && e.toLowerCase()).filter(Boolean);

/* Forgot / Reset password helpers for Firebase (compat)
   - Requires firebase (compat) to be loaded & initialized before this script runs.
   - If you use your existing sign.js that sets USE_FIREBASE, it will use firebase when available.
*/
