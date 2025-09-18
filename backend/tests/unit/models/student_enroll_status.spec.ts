import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import StudentEnrollStatus, { 
  type InternshipApprovalStatus, 
  type CommitteeVote, 
  type InstructorAssignmentAudit 
} from '#models/student_enroll_status'

test.group('StudentEnrollStatus Model - Internship Approval Extensions', () => {
  
  test('model has correct status type definition', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    // Test that status can be set to new values
    status.status = 'registered'
    assert.equal(status.status, 'registered')
    
    status.status = 't.approved'
    assert.equal(status.status, 't.approved')
    
    status.status = 'c.approved'
    assert.equal(status.status, 'c.approved')
  })

  test('canTransitionTo validates status transitions correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    // Test valid transitions from registered
    status.status = 'registered'
    assert.isTrue(status.canTransitionTo('t.approved'))
    assert.isTrue(status.canTransitionTo('denied'))
    assert.isFalse(status.canTransitionTo('c.approved'))
    
    // Test valid transitions from t.approved
    status.status = 't.approved'
    assert.isTrue(status.canTransitionTo('c.approved'))
    assert.isTrue(status.canTransitionTo('denied'))
    assert.isFalse(status.canTransitionTo('registered'))
    
    // Test valid transitions from c.approved
    status.status = 'c.approved'
    assert.isTrue(status.canTransitionTo('doc.approved'))
    assert.isTrue(status.canTransitionTo('doc.cancel'))
    assert.isFalse(status.canTransitionTo('t.approved'))
  })

  test('transitionTo method works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.status = 'registered'
    status.status_history = []
    
    // Mock save method to avoid database operations
    status.save = async () => status
    
    // Test valid transition
    const result = await status.transitionTo('t.approved', 1, 'Advisor approved')
    assert.isTrue(result)
    assert.equal(status.status, 't.approved')
    assert.equal(status.status_history.length, 1)
    assert.equal(status.status_history[0].fromStatus, 'registered')
    assert.equal(status.status_history[0].toStatus, 't.approved')
    assert.equal(status.status_history[0].changedBy, 1)
    assert.equal(status.status_history[0].reason, 'Advisor approved')
    
    // Test invalid transition
    const invalidResult = await status.transitionTo('registered', 1)
    assert.isFalse(invalidResult)
    assert.equal(status.status, 't.approved') // Status should not change
  })

  test('committee voting methods work correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = []
    status.committee_vote_count = 0
    status.required_committee_votes = 3
    status.committee_voting_deadline = DateTime.now().plus({ days: 7 })
    
    // Mock save method
    status.save = async () => status
    
    // Test adding committee vote
    const voteResult = await status.addCommitteeVote(1, 'approve', 'Good application')
    assert.isTrue(voteResult)
    assert.equal(status.committee_votes.length, 1)
    assert.equal(status.committee_vote_count, 1)
    assert.equal(status.committee_votes[0].instructorId, 1)
    assert.equal(status.committee_votes[0].vote, 'approve')
    assert.equal(status.committee_votes[0].remarks, 'Good application')
    
    // Test duplicate vote prevention
    const duplicateResult = await status.addCommitteeVote(1, 'reject')
    assert.isFalse(duplicateResult)
    assert.equal(status.committee_votes.length, 1) // Should not increase
    
    // Test voting completion check
    assert.isFalse(status.isCommitteeVotingComplete())
    
    // Add more votes
    await status.addCommitteeVote(2, 'approve')
    await status.addCommitteeVote(3, 'reject')
    
    assert.isTrue(status.isCommitteeVotingComplete())
  })

  test('committee voting result calculation works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = [
      { instructorId: 1, vote: 'approve', votedAt: DateTime.now() },
      { instructorId: 2, vote: 'approve', votedAt: DateTime.now() },
      { instructorId: 3, vote: 'reject', votedAt: DateTime.now() }
    ]
    
    const result = status.getCommitteeVotingResult()
    assert.equal(result.approveCount, 2)
    assert.equal(result.rejectCount, 1)
    assert.isTrue(result.approved)
    
    // Test tie scenario
    status.committee_votes.push({ instructorId: 4, vote: 'reject', votedAt: DateTime.now() })
    const tieResult = status.getCommitteeVotingResult()
    assert.equal(tieResult.approveCount, 2)
    assert.equal(tieResult.rejectCount, 2)
    assert.isFalse(tieResult.approved) // Reject wins in tie
  })

  test('hasInstructorVoted method works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = [
      { instructorId: 1, vote: 'approve', votedAt: DateTime.now() },
      { instructorId: 2, vote: 'reject', votedAt: DateTime.now() }
    ]
    
    assert.isTrue(status.hasInstructorVoted(1))
    assert.isTrue(status.hasInstructorVoted(2))
    assert.isFalse(status.hasInstructorVoted(3))
  })

  test('getStatusDisplayName returns correct Thai names', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    status.status = 'registered'
    assert.equal(status.getStatusDisplayName(), 'ลงทะเบียน')
    
    status.status = 't.approved'
    assert.equal(status.getStatusDisplayName(), 'อาจารย์ที่ปรึกษาอนุมัติ')
    
    status.status = 'c.approved'
    assert.equal(status.getStatusDisplayName(), 'คณะกรรมการอนุมัติ')
    
    status.status = 'doc.approved'
    assert.equal(status.getStatusDisplayName(), 'เอกสารอนุมัติ')
  })

  test('requiresCommitteeVoting method works correctly', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    
    status.status = 'registered'
    assert.isFalse(status.requiresCommitteeVoting())
    
    status.status = 't.approved'
    assert.isTrue(status.requiresCommitteeVoting())
    
    status.status = 'c.approved'
    assert.isFalse(status.requiresCommitteeVoting())
  })

  test('committee voting deadline is respected', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.committee_votes = []
    status.committee_voting_deadline = DateTime.now().minus({ days: 1 }) // Past deadline
    
    // Mock save method
    status.save = async () => status
    
    // Should not allow voting after deadline
    const result = await status.addCommitteeVote(1, 'approve')
    assert.isFalse(result)
    assert.equal(status.committee_votes.length, 0)
  })

  test('status history tracks all transitions', async ({ assert }) => {
    const status = new StudentEnrollStatus()
    status.status = 'registered'
    status.status_history = []
    
    // Mock save method
    status.save = async () => status
    
    // Make multiple transitions
    await status.transitionTo('t.approved', 1, 'Advisor approved')
    await status.transitionTo('c.approved', 2, 'Committee approved')
    
    assert.equal(status.status_history.length, 2)
    assert.equal(status.status_history[0].fromStatus, 'registered')
    assert.equal(status.status_history[0].toStatus, 't.approved')
    assert.equal(status.status_history[1].fromStatus, 't.approved')
    assert.equal(status.status_history[1].toStatus, 'c.approved')
  })

  test('model class has correct structure', async ({ assert }) => {
    // Test that the class exists and is a constructor function
    assert.isFunction(StudentEnrollStatus)
    assert.equal(typeof StudentEnrollStatus, 'function')
    
    // Test that it can be instantiated
    const status = new StudentEnrollStatus()
    assert.instanceOf(status, StudentEnrollStatus)
  })

  test('model has table configuration', async ({ assert }) => {
    // Test that the model has a table property (inherited from BaseModel)
    assert.property(StudentEnrollStatus, 'table')
    assert.equal(typeof StudentEnrollStatus.table, 'string')
  })
})})
})Id, 2)
  nstructorewI0].nent_history[gnmsi_asructortus.instt.equal(sta    asserh, 1)
ry.lengtnt_histoignmetor_asss.instruc.equal(staturtassentry]
    [mockE = istorygnment_hssir_astructointatus.
    s       }
 false
cationSent:   notifinge',
    cha 'Test      reason:),
 eTime.now(dAt: Datange
      chgedBy: 100,  chan
    2,: ctorIdtru     newInstorId: 1,
 ucviousInstr    pre= {
  udit entArAssignmInstructo mockEntry: nst  cotly
   correcworksrray ted aulahat popt tes  // T
  h, 0)
    tory.lengtnt_hisor_assignmenstructstatus.issert.equal(y)
    aorent_histsignmor_ass.instructtaturt.isArray(s   asse= []
 tory nment_hisuctor_assigatus.instr    storrectly
ed c handl array ist empty// Test tha   
 )
    nrollStatus(entEnew Stud = status    const  => {
 })nc ({ assert, asyd'izey serialoperlistory is pr hnment assiguctorest('instr)

  t)
  }y, 101ge.changedBhancondCequal(se    assert.torId, 3)
rucge.newInstecondChanrt.equal(s
    asserId, 2)ousInstructovie.pre(secondChangert.equal]
    assistory[1signment_h_asnstructor status.i =ndChangest seco
    cond changeCheck secon   
    // 00)
 , 1edByhangirstChange.cal(f assert.equ   ctorId, 2)
nstruChange.newIstir.equal(fssert
    atorId, 1)viousInstrucChange.preual(firsteq
    assert.]nt_history[0signmenstructor_asatus.itChange = stt firs
    const change/ Check firs 
    /h, 2)
   istory.lengtssignment_hr_astructo.inqual(statusassert.e)
    d, 3r_istructol(status.inuaert.eq
    ass
    ond change')ec'S1, (3, 10tortrucngeInsatus.chat stawai    ange
Second ch  
    // )
  rst change'Fi 100, 'uctor(2,hangeInstratus.cawait st  
  ngest cha/ Fir 
    / status
   () => = async tus.saveod
    stameth Mock save  
    //ed'
   erregist= 'tus.status sta   ]
 ry = [t_histoignmenssstructor_a  status.in  d = 1
ructor_istatus.instus()
    tatudentEnrollSew St n =nst status{
    co=> }) assert  async ({ udit trail',complete a create  changesinstructorle t('multip})

  tes entry
  it) // No audength, 0y.ltornment_hisassigtor_ruc(status.instqualassert.e     change
Should notid, 1) // uctor_tus.instral(staequt. asser   t)
ul.isFalse(res  assert
    
  structor')inme 1, 100, 'Saructor(nsttus.changeItaait sesult = awonst r  ctor
  nstrucme i sasignto as    // Try 
    
tus () => sta asyncsave =s.  statuhod
  ave met // Mock s    
   ered'
giststatus = 're status.ry = []
   toisent_hor_assignminstructs.statu1
    _id = nstructoratus.i    st
tus()EnrollStaw Studenttatus = ne const s> {
   ert }) =nc ({ ass', asynges chavalidtion for infails validar Instructochangetest('
  4)
  })
d, rIwInstructo.need[1]l(unnotifit.equaasser3)
    ructorId, 0].newInstied[l(unnotif assert.equa)
   d.length, 2nnotifiert.equal(u   assehanges()
 tCenedAssignmtifigetUnnoatus.fied = stnotinst un   co
    
 }
    ]       false
ent:cationSfi        noti(),
eTime.nowat D changedAt:2,
       ngedBy: 10ha c       rId: 4,
ctoInstru
        newd: 3,tructorIsInsviou     pre
   
      {     },
 ent: falseficationSti      no: 1 }),
  ayss({ d().minuime.nowDateTAt: nged   cha1,
     dBy: 10    change3,
    Id: nstructor     newIId: 2,
   Instructorus     previo{
   
         },t: true
   ficationSen     noti: 2 }),
   us({ days).minime.now(ateTAt: Dhanged       c
  100, changedBy: 2,
       Id:nstructor   newI
     d: 1,rItousInstrucevio
        pr     {
  = [storynment_hir_assiguctotatus.instr satus()
   nrollStnew StudentEs = tu  const sta
  ert }) => {nc ({ assectly', asyers corrs filtgnmentChangeotifiedAssitest('getUnn)

  h, 0)
  }ngt_history.lenmentassiginstructor_us.qual(stat    assert.ent()
ionSetificatmarkNoatus. await st error
    not throwShould//   
    us
  c () => stat = asyntus.save  staethod
  ock save m  // M
  
    ory = []t_histr_assignmentoinstruc   status.)
 tus(ollStantEnr new Stude =usat   const st => {
 { assert })async (ly', cefulstory gras empty hi handleSentificationarkNot test('m

 )
  })ntnSetiotificaistory[0].nossignment_hinstructor_a(status.ue.isTr
    assert
    nSent()tiocaarkNotifit status.m  awai
    
  ) => statusnc (s.save = asy    statuthod
me save 
    // Mock  ]
     }
    : false
   icationSent     notif,
    })s: 1s({ day.minuteTime.now()hangedAt: Da        c
100,: ngedBy   cha 2,
     ructorId:st newIn1,
       orId: usInstruct    previo    

      {tory = [ignment_hisssuctor_astatus.instr  tus()
  entEnrollStas = new Studtatu snst co  => {
  }) { assertync (t entry', astes latesionSent updaattificrkNo  test('ma))
  })

enAssigned(4structorBehasIns.sFalse(statu.iassert    r
d instructoever assigne 
    // Ned(2))
   BeenAssignorstructstatus.hasInrt.isTrue(  asse  
ed(1))rBeenAssignhasInstructous.(statsTrueassert.iry
    histotors in trucinsrevious  
    // P(3))
   BeenAssignedstructortatus.hasIn.isTrue(srt    assetructor
rrent ins
    // Cu  ]
    }
    
    t: falseationSen  notific      ays: 1 }),
s({ d).minume.now(t: DateTingedA cha  
     edBy: 101,      chang: 3,
  tructorIdewIns,
        nructorId: 2usInst    previo
      { },
       true
  onSent: ificati
        not 2 }),days:({ nusow().mi DateTime.nngedAt:    cha0,
    ngedBy: 10      charId: 2,
  ructo     newInstd: 1,
   rInstructo previousI  {
       
     = [_historyr_assignmenttostructus.in   sta
 tor_id = 3nstruc   status.itatus()
 llSntEnroude Sttus = newst sta  con) => {
   ({ assert }, asyncssignments'ical aistor and hs currenteck chAssignedenctorBetruIns('hasst  te })

l(latest)
 rt.isNulsse
    a()orChangeestInstructus.getLatst = statonst late   
    cory = []
 ignment_histstructor_assus.in
    statllStatus()tudentEnro Sus = newstatt {
    cons) =>  ({ assert }yncasistory', or empty hs null furn retructorChangetLatestInst test('ge

 Id, 3)
  })uctornewInstrual(latest!.rt.eq assehange')
   est ceason, 'Latst!.r.equal(lateasserttest)
    Null(la.isNotrt   asseChange()
 tructorestInsus.getLattest = stat   const la
    
 oryckHistmoy = ornment_histigctor_ass.instru   status  
  ]
  }
          false
ent:ionSficatnoti
        e',est chang: 'Lateason   r     1 }),
 days:().minus({ ime.nowgedAt: DateT       chandBy: 101,
 hange     c   Id: 3,
structor      newInd: 2,
  rItostrucusInvio pre     {
          },
   e
 Sent: trucationotifi   ne',
     'First chang  reason:       }),
s({ days: 2 .now().minu DateTimeangedAt:
        ch 100,hangedBy:
        c 2,orId:nstruct   newI
     ctorId: 1,sInstru   previou   {
     
   dit[] = [AssignmentAustructorInry: stomockHiconst ()
    ustattEnrollS= new Studenstatus 
    const => { }) assert', async ({ change recent rns mostange retutorChestInstrucst('getLat

  te)
  })ryArray(histoissert., 0)
    asthory.lengal(hist assert.equry()
   entHistonmigtructorAssnsetItatus.gry = snst histoco     

   y = []tornt_histor_assignmetus.instruc    staatus()
tEnrollSttudens = new S const statu
   }) => { ({ assert tory', async empty hisory handlesistnmentHctorAssiggetInstrust(' })

  te
 mockHistory)(history, qualt.deepE   asserth, 2)
 y.lengort.equal(hist  asserory()
  istssignmentHtInstructorAus.gestory = statonst hi   c 
 ory
   mockHistt_history = ignmenstructor_ass  status.in ]
    
   }
       false
 ationSent:   notific  ge',
    hancond con: 'Se    reas     1 }),
days:minus({ ow().eTime.ndAt: Dat      change
  : 101,   changedBy    d: 3,
 orIuct    newInstr2,
    tructorId: Insrevious     p    {
   ,
      }  rue
: tnttionSeifica        notnge',
'First cha  reason: ),
       2 }us({ days:.minTime.now()At: Dateanged  ch
       100,By:hanged   c     torId: 2,
newInstruc
        ctorId: 1,Instru previous
            {dit[] = [
 gnmentAuorAssistructkHistory: Inonst moctus()
    cEnrollSta new Studentnst status ==> {
    co}) { assert ync (ry', ast historrecturns coistory retHignmenAssoructetInstr test('g

  })r(-1))
 ngeInstructonUserChastatus.caisFalse(ert. ass)
   nstructor(0)erChangeIs.canUstatu(salsert.isFseID
    asuser  // Invalid 
   (100))
    structorChangeIn.canUsere(statusrurt.isTasse   ))
 or(1eInstructserChangtatus.canUrt.isTrue(s  asseer ID
  id us    // Val()
    
EnrollStatusdentStuus = new onst stat> {
    csert }) =({ ass', async sionisr permlidates useor vanstructeIChang'canUsertest(
  })

  (2))uctorgeInstrhancanCse(status.rt.isFal
    asseel'ncs = 'doc.caatus.statuel)
    st (doc.cancatus: final stidnval    // I))
    
s anytor(null angeInstructus.canChalse(stassert.isFa   aructor ID
 nstll i Invalid: nu  //))
    
  (-1eInstructors.canChangatuisFalse(stt.asser(0))
    structorChangeIn.canlse(status assert.isFaID
   tructor ative insego or n zeralid:    // Inv    
(1))
ortructChangeInstatus.canalse(s.isFsert
    asinstructorvalid: same 
    // In))
    (2ctorangeInstrucanChus.statue(assert.isTructor
    rent instr to diffeged chan Vali
    //    gistered'
 'res =atus.statu 1
    stor_id =truct.ins  status)
  us(llStat StudentEnro = newusnst stat
    cort }) => {nc ({ assely', asys correctgeignment chanates assr valiductoInstrhange  test('canC
  })

uctorId, 1).newInstruditEntryequal(aassert.   
 orId)nstructry.previousId(auditEnt.isUndefine    assertstory[0]
nt_hi_assignmeructorus.insty = statauditEntr
    const   )
  y.length, 1istort_hassignmenor_tus.instructl(sta.equa    assertor_id, 1)
s.instructual(statuassert.eq
    lt).isTrue(resuert ass  
    
 nt')signme'Initial as100, 1, eInstructor(ngtatus.chaawait ssult =  const retructor
    insst firssign  
    // A
  () => statusave = async tus.s    stae method
 sav// Mock
    
    red'egiste = 'r.status
    status []history =_assignment_tructorns status.is any
   _id = null actor.instrutatus
    satus()tEnrollSt Studenstatus = newconst  => {
    sert }){ as async (instructor',ious null prevndles  hanstructorngeIst('cha })

  te
 me) DateTigedAt,anuditEntry.chnstanceOf(aassert.i)
    nSentotificatiotEntry.nudilse(aassert.isFaatch')
    rtise m'Better expeeason, .rl(auditEntrysert.equa100)
    as, edBychangry.(auditEntqual    assert.e, 2)
structorIdwInEntry.nel(audituaeq
    assert., 1)structorIdviousInry.prentequal(auditE assert.ry[0]
   ent_histo_assignm.instructor= statusEntry t audit
    cons 1)
   ngth, ory.lenment_histctor_assigruststatus.insert.equal(    astor_id, 2)
atus.instrucstert.equal(
    ass(result)True assert.is
    
   ')se matchexperti00, 'Better uctor(2, 1.changeInstrawait statussult = st re con
   e instructor // Chang   atus
    
=> st = async () status.saveod
    thve meck sa   // Mo  
 
  tered' 'registus.status =stay = []
    torhisnment__assigtoratus.instruc1
    sttor_id = rucstatus.inst    Status()
ll StudentEnro newnst status = {
    co}) =>ert ssc ({ a', asynil entry traiteates audod cror methructeInst'chang
  test( () => {
  Trail',dit Auent tor Assignm Instrucodel -us MllStatEnrotudentest.group('S

t