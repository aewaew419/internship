import type { HttpContext } from '@adonisjs/core/http'
import StudentEnrollStatus from '#models/student_enroll_status'
import StudentEnroll from '#models/student_enroll'
import { DateTime } from 'luxon'
import type { 
  ApprovalStatusResponse, 
  CommitteeVotingData,
  InternshipApprovalStatus 
} from '#types/internship_approval'

export default class InternshipApprovalController {
  /**
   * Get current approval status for a student enrollment
   * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1
   */
  public async getApprovalStatus({ params, response }: HttpContext): Promise<ApprovalStatusResponse> {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      
      // Find the student enrollment with related data
      const studentEnroll = await StudentEnroll.query()
        .where('id', studentEnrollId)
        .preload('student')
        .preload('course_section')
        .first()

      if (!studentEnroll) {
        return response.notFound({ message: 'Student enrollment not found' })
      }

      // Get all status records for this enrollment
      const statusRecords = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .preload('instructor')
        .orderBy('updated_at', 'desc')

      if (statusRecords.length === 0) {
        return response.notFound({ message: 'No approval status found for this enrollment' })
      }

      // Get the most recent status record to determine current status
      const currentStatusRecord = statusRecords[0]
      const currentStatus = this.determineOverallStatus(statusRecords)

      // Build the response
      const approvalStatusResponse: ApprovalStatusResponse = {
        studentEnrollId,
        currentStatus,
        statusText: this.getStatusDisplayText(currentStatus),
        statusUpdatedAt: currentStatusRecord.updatedAt.toISO(),
        
        // Committee voting information
        committeeVotes: currentStatusRecord.committee_votes.map(vote => ({
          instructorId: vote.instructorId,
          vote: vote.vote,
          votedAt: vote.votedAt.toISO(),
          remarks: vote.remarks
        })),
        approvalPercentage: this.calculateApprovalPercentage(currentStatusRecord.committee_votes),
        
        // Status history
        statusHistory: currentStatusRecord.status_history.map(transition => ({
          fromStatus: transition.fromStatus,
          toStatus: transition.toStatus,
          changedBy: transition.changedBy,
          changedAt: transition.changedAt.toISO(),
          reason: transition.reason
        }))
      }

      // Add advisor information if available
      const advisorRecord = statusRecords.find(record => 
        record.status === 't.approved' || record.status === 'approve'
      )
      if (advisorRecord) {
        approvalStatusResponse.advisorId = advisorRecord.instructor_id
        approvalStatusResponse.advisorApprovalDate = advisorRecord.updatedAt.toISO()
      }

      return approvalStatusResponse
    } catch (error) {
      return response.internalServerError({ 
        message: 'Failed to retrieve approval status',
        error: error.message 
      })
    }
  }  /*
*
   * Handle advisor approval or rejection
   * Requirements: 2.1, 2.2, 2.3
   */
  public async advisorApproval({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { approved, remarks } = request.only(['approved', 'remarks'])
      const currentUser = auth.user

      if (!currentUser) {
        return response.unauthorized({ message: 'Authentication required' })
      }

      // Find the advisor's status record for this enrollment
      const statusRecord = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .where('instructor_id', currentUser.id)
        .first()

      if (!statusRecord) {
        return response.notFound({ 
          message: 'Advisor status record not found for this enrollment' 
        })
      }

      // Validate current status allows advisor approval
      if (statusRecord.status !== 'registered' && statusRecord.status !== 'pending') {
        return response.badRequest({ 
          message: 'Enrollment is not in a state that allows advisor approval' 
        })
      }

      // Determine new status based on approval decision
      const newStatus: InternshipApprovalStatus = approved ? 't.approved' : 'doc.approved'
      
      // Update the status with transition tracking
      const transitionSuccess = await statusRecord.transitionTo(
        newStatus,
        currentUser.id,
        remarks || `Advisor ${approved ? 'approved' : 'rejected'} the application`
      )

      if (!transitionSuccess) {
        return response.badRequest({ 
          message: 'Invalid status transition' 
        })
      }

      // Update remarks
      if (remarks) {
        statusRecord.remarks = remarks
        await statusRecord.save()
      }

      return {
        message: `Application ${approved ? 'approved' : 'rejected'} successfully`,
        studentEnrollId,
        newStatus,
        updatedAt: statusRecord.updatedAt.toISO()
      }
    } catch (error) {
      return response.internalServerError({ 
        message: 'Failed to process advisor approval',
        error: error.message 
      })
    }
  }

  /**
   * Handle committee member voting
   * Requirements: 3.1, 3.2, 3.3
   */
  public async committeeMemberVote({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { vote, remarks } = request.only(['vote', 'remarks'])
      const currentUser = auth.user

      if (!currentUser) {
        return response.unauthorized({ message: 'Authentication required' })
      }

      if (!['approve', 'reject'].includes(vote)) {
        return response.badRequest({ message: 'Vote must be either "approve" or "reject"' })
      }

      // Find the committee member's status record for this enrollment
      const statusRecord = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .where('instructor_id', currentUser.id)
        .first()

      if (!statusRecord) {
        return response.notFound({ 
          message: 'Committee member status record not found for this enrollment' 
        })
      }

      // Validate current status allows committee voting
      if (statusRecord.status !== 't.approved') {
        return response.badRequest({ 
          message: 'Enrollment is not in a state that allows committee voting' 
        })
      }

      // Check if instructor has already voted
      if (statusRecord.hasInstructorVoted(currentUser.id)) {
        return response.badRequest({ 
          message: 'You have already voted on this application' 
        })
      }

      // Add the vote
      const voteSuccess = await statusRecord.addCommitteeVote(
        currentUser.id,
        vote,
        remarks
      )

      if (!voteSuccess) {
        return response.badRequest({ 
          message: 'Failed to record vote. Voting may be closed or you may have already voted.' 
        })
      }

      // Check if voting is complete and determine final status
      const votingResult = statusRecord.getCommitteeVotingResult()
      let finalStatus: InternshipApprovalStatus | null = null

      if (statusRecord.isCommitteeVotingComplete()) {
        finalStatus = votingResult.approved ? 'c.approved' : 'doc.approved'
        
        await statusRecord.transitionTo(
          finalStatus,
          currentUser.id,
          `Committee voting completed: ${votingResult.approveCount} approve, ${votingResult.rejectCount} reject`
        )
      }

      return {
        message: 'Vote recorded successfully',
        studentEnrollId,
        vote,
        votingResult: {
          approveCount: votingResult.approveCount,
          rejectCount: votingResult.rejectCount,
          isComplete: statusRecord.isCommitteeVotingComplete(),
          finalDecision: finalStatus
        },
        updatedAt: statusRecord.updatedAt.toISO()
      }
    } catch (error) {
      return response.internalServerError({ 
        message: 'Failed to process committee vote',
        error: error.message 
      })
    }
  }  
/**
   * Update approval status (administrative function)
   * Requirements: 4.1
   */
  public async updateApprovalStatus({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { status, reason } = request.only(['status', 'reason'])
      const currentUser = auth.user

      if (!currentUser) {
        return response.unauthorized({ message: 'Authentication required' })
      }

      // Validate the new status
      const validStatuses: InternshipApprovalStatus[] = [
        'registered', 't.approved', 'c.approved', 'doc.approved', 'doc.cancel'
      ]
      
      if (!validStatuses.includes(status)) {
        return response.badRequest({ 
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        })
      }

      // Find all status records for this enrollment
      const statusRecords = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)

      if (statusRecords.length === 0) {
        return response.notFound({ 
          message: 'No status records found for this enrollment' 
        })
      }

      // Update all status records to the new status
      const updatePromises = statusRecords.map(async (record) => {
        return await record.transitionTo(
          status,
          currentUser.id,
          reason || 'Administrative status update'
        )
      })

      const results = await Promise.all(updatePromises)
      const successCount = results.filter(result => result).length

      return {
        message: `Status updated successfully for ${successCount} records`,
        studentEnrollId,
        newStatus: status,
        updatedRecords: successCount,
        updatedAt: DateTime.now().toISO()
      }
    } catch (error) {
      return response.internalServerError({ 
        message: 'Failed to update approval status',
        error: error.message 
      })
    }
  }

  /**
   * Get committee voting data for a specific enrollment
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  public async getCommitteeVotingData({ params, response }: HttpContext): Promise<CommitteeVotingData> {
    try {
      const studentEnrollId = Number(params.studentEnrollId)

      // Get all committee status records for this enrollment
      const statusRecords = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .preload('instructor')

      if (statusRecords.length === 0) {
        return response.notFound({ 
          message: 'No status records found for this enrollment' 
        })
      }

      // Aggregate committee votes from all records
      const allCommitteeVotes = statusRecords.flatMap(record => record.committee_votes)
      const totalCommitteeMembers = statusRecords.length
      const approvalPercentage = this.calculateApprovalPercentage(allCommitteeVotes)
      
      // Determine if voting is complete (simplified logic)
      const votingComplete = allCommitteeVotes.length >= Math.ceil(totalCommitteeMembers / 2)
      
      let finalDecision: 'approved' | 'rejected' | undefined
      if (votingComplete) {
        const approveCount = allCommitteeVotes.filter(v => v.vote === 'approve').length
        const rejectCount = allCommitteeVotes.filter(v => v.vote === 'reject').length
        finalDecision = approveCount > rejectCount ? 'approved' : 'rejected'
      }

      const committeeVotingData: CommitteeVotingData = {
        studentEnrollId,
        totalCommitteeMembers,
        currentVotes: allCommitteeVotes,
        approvalPercentage,
        votingComplete,
        finalDecision
      }

      return committeeVotingData
    } catch (error) {
      return response.internalServerError({ 
        message: 'Failed to retrieve committee voting data',
        error: error.message 
      })
    }
  }  /**

   * Helper method to determine overall status from multiple status records
   */
  private determineOverallStatus(statusRecords: StudentEnrollStatus[]): InternshipApprovalStatus {
    // Priority order for status determination
    const statusPriority: Record<InternshipApprovalStatus, number> = {
      'doc.cancel': 6,
      'c.approved': 5,
      'doc.approved': 4,
      't.approved': 3,
      'registered': 2,
      'approve': 1,
      'denied': 1,
      'pending': 0
    }

    let highestPriorityStatus: InternshipApprovalStatus = 'registered'
    let highestPriority = -1

    for (const record of statusRecords) {
      const priority = statusPriority[record.status] || 0
      if (priority > highestPriority) {
        highestPriority = priority
        highestPriorityStatus = record.status
      }
    }

    return highestPriorityStatus
  }

  /**
   * Helper method to get display text for status
   */
  private getStatusDisplayText(status: InternshipApprovalStatus): string {
    const statusTexts: Record<InternshipApprovalStatus, string> = {
      'registered': 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
      't.approved': 'อยู่ระหว่างการพิจารณา โดยคณะกรรมการ',
      'c.approved': 'อนุมัติเอกสารขอฝึกงาน / สหกิจ',
      'doc.approved': 'ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ',
      'doc.cancel': 'ยกเลิกการฝึกงาน/สหกิจ',
      'approve': 'อนุมัติ',
      'denied': 'ปฏิเสธ',
      'pending': 'รอดำเนินการ'
    }

    return statusTexts[status] || status
  }

  /**
   * Cancel approved internship (administrative function)
   * Requirements: 4.1, 4.2
   */
  public async cancelApprovedInternship({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { reason } = request.only(['reason'])
   ser
 
}100)
  }length) * nt / votes.((approveCoun Math.roundtur   rength
 ').le'approveote === e.vte => vot.filter(vount = voteseCot approv  
    cons  rn 0
retuh === 0) s.lengtte
    if (vo {): numbery[] anotes:centage(vprovalPerculateApvate cal pri
   */
  votescommitteefrom ge ercentaval papproalculate o cer method t  * Help**
  /'
  }

 ncel= 'doc.cas ==tu|| sta|| isStuck Conflicts eturn has   
    r7
    )
 ays > , 'days').dd.updatedAt).diff(recorime.now(  DateT=> 
    cord ome(re& records.s &d''t.approve status === uck =St is
    const )
    
      )')
   error.includes('on?.reasansition') || trconflictincludes('on?.nsition.reas
        tra ition =>nsme(tra.sohistorys_.statu  record
    (record => omeecords.ss = rConflictst has   conon
 n attentiequire admions that rious conditieck for var
    // Ch boolean {tus[]):lStarolStudentEn, records: atusovalStnshipApprus: Interention(statstrativeAttAdminirequiresprivate */
  on
   enti attrativees administrequirollment f enrne imiterthod to demer    * Helpe /**


  }
  }   })
 
      .message: erroror  err
       queue',istrativedminve ato retriege: 'Failed sa  mesr({ 
      ErroServernse.internalpo return res    (error) {
    } catch    }
    t }
set, off, limi, search: { statusrstefil      
  e.length,eQueunistrativCount: admiotal       t,
 uerativeQue: administueue   q {
         return })

     
  e
        }al_outcomryRecord.finme: primalOutco  fina    ,
    , records)atusverallSteAttention(orativsAdministre.requi: thistentionAtires    requ      
oISO(),dAt.t.updatecordReimaryprUpdated: last         atus),
 verallStxt(oplayTeusDisetStatext: this.gusTat        stus,
  lStat overaltatus:rentS    cur      ame,
ourse.nion.crse_sect.coullent_enroRecord.studame: primaryseN     cour     nt.name,
enroll.studedent_d.stuecorme: primaryRNa    studentd,
      t_iudenudent.stt_enroll.stdenstucord.RemaryprintId: de stu
         lId,Id: enrolrolltudentEn    s{
      urn  ret       
        
(records)erallStatusOvis.determineStatus = thrall   const ove
     s[0]record= yRecord nst primar
        coords]) => {rec[enrollId, ((()).mapap.entriesrollmentMfrom(en = Array.ueueeQrativadminist    const    }

  ord)
   rech(lId).pusap.get(enrolntMrollme        en }

       ollId, [])tMap.set(enr enrollmen
         )) {s(enrollId.hallmentMapif (!enro        oll_id
.student_enrordlId = rect enrol   consds) {
     orectatusRord of snst recco   for (      
   )
 new Map(llmentMap =enro  const 
    tatusl srmine overaletend dllment astudent enrooup by Gr     // sc')

  'deupdated_at',('rderByy.ot querawaicords = usRenst stat    coset))

  ff(Number(offset(limit)).ot(Numberquery.limiuery = ion
      qginat  // Pa  }

     })
           })
        h}%`)
  {searcke', `%$nt_id', 'li('stude    .orWhere          rch}%`)
e', `%${seaname', 'likuery.where('entQ   stud     => {
     y)Quer, (studentudent'whereHas('stlQuery.nrol       e  ) => {
 llQueryl', (enroenroldent_reHas('stu= query.whe     query ch) {
   ar     if (se
 ctionalityh fun  // Searc }

    s)
     tu', statuswhere('staery.y = qu        querstatus) {

      if (f provided status i by  // Filter

    structor')preload('in       . })
        })
       )
   oad('course'ely.prctionQuer          sey) => {
  nQuer', (sectioe_sectionrsoad('coueluery.pr     enrollQ)
     ('student'loadQuery.pre      enroll   => {
  nrollQuery)oll', (e'student_enr  .preload()
      ery(s.qurollStatuEnntStude= ery       let quest.qs()

requ =  0 }set == 50, offt h, limisearcstatus,  const {     try {
  
   xt) {Conteonse }: Httpresp, quest({ retrativeQueueAdminisc get public asyn*/
 1, 4.4
   s: 4.nteme * Requirention
  ative attng administrents requirillm all enro * Get
  /**
   }
 }
 
   
      })ge messaerror.error:        y',
 historve status ed to retrieFailmessage: '       rError({ 
 rveternalSeponse.ineturn res) {
      rch (error
    } cat()
      }toISOdAt.s[0].updateusRecord: stattedtUpda   las     ),
atusRecordss(stallStatuetermineOverhis.dntStatus: t      curreons,
  TransitialltusHistory:         stangth,
nsitions.le allTraions:ansit totalTr
       nrollId,udentE       sturn {
    ret

      )  Time()
 edAt).gette(a.chang) - new DatTime(angedAt).ge.chDate(bew 
        n) => s.sort((a, btionlTransi      alst)
 fircent re date (most  // Sort by          )

)
  })wn'
      noe || 'Unktructor?.namnsrd.i recoructorName:     inst,
     d.id recorordId:    rec      nsition,
ra        ...t> ({
  sition =tranp(story.matatus_hi.srecord> 
        Map(record =cords.flattatusResitions = st allTran  cons  rds
  om all reconsitions frl status tragate al   // Aggre   }

   
   
        })t' nrollmenthis ed for rds foun reco: 'No statusge   messa 
       otFound({e.nns respo     return== 0) {
   ength =cords.lsRe (statuif

      'desc')ted_at', y('upda    .orderB')
    nstructor .preload('i     nrollId)
  d', studentEenroll_ient_stud    .where('ery()
    .quatusStntEnrolltudeait Scords = awtatusRe    const s
  storyheir hiith t records wtatus/ Get all s
      /nrollId)
ams.studentE(par= NumberEnrollId onst student c     
 {    tryontext) {
ttpCnse }: H respo params,istory({etStatusHync g
  public as
   */4.4ents: 4.3, quirem  * Renrollment
 r an e fo trailudittory ahisus  Get stat  /**
   *  }

  }
      })
  ge 
error.messaerror: ',
         outcomeo set finald t'Failessage:     me{ 
    verError(nalSerse.interespon  return r{
     (error)   } catch      }
  
().toISO()eTime.nowatedAt: Dupdat   come,
     come: outinalOut      flId,
  ntEnrol  stude    ully`,
  cessfcome} suc ${outtcome set to`Final ousage:      mes   n {

      retur
Promises)l(updateomise.alwait Pr    a })

  ve()
     cord.san await re    retur
    )
             }`
   emarks : ''? ': ' + r${remarks tcome}to ${oume set `Final outco       id,
   er.entUs  currs
         statueep samestatus, // Krd.   reco     
  sitionTo(.tranecordit r
        awa settingomeutcord for otion recAdd transi/  
        /        }
     marks
  emarks = reecord.r       r{
   ks)   if (remarme
      ome = outcoinal_outcrecord.f {
         =>ecord)async (rRecords.map(tus = staesmisePropdatonst urds
      cor all recome final outcodate f      // Up      }

       })
 
 ps'd internshir approve be set fon onlye cacom'Final out   message:        ({ 
questonse.badRern resp        returoved') {
 'c.app !==ntStatusre  if (curds)
    tusRecorllStatus(staveraineOdeterm = this.tStatusrrenst cu    con
   statein approvedship is internck if     // Che
  
      }
     })nt' 
   llme enrofor this found ecordsNo status r  message: '        d({ 
Founotn response.ntur   re {
      === 0)engthsRecords.ltatu      if (s

ollId)nrudentE', stnt_enroll_idre('stude  .whe    y()
  atus.querrollSttEnStudenawait ords = st statusRec    conment
  enrollfor this cords status rend all 
      // Fi }
  })
        
   led"' ai or "Fer "Pass"ust be eith m'Outcome  message:    
      adRequest({.bsponse  return re
      ) {outcome).includes('Failed'] (!['Pass',       if}

' })
      redequication r'Authentige: ed({ messauthorizesponse.unareturn r       ser) {
 ntU (!curre     if
 
.userthtUser = au curren     constrks'])
 remacome', 'ut(['oonlyuest.} = reqks , remarmet { outco    cons
  d)ntEnrollIudeparams.st= Number(EnrollId t student     cons
 try {xt) {
     HttpConteauth }: response, s, request,come({ paramlOuttFinac seasynblic pu
   */
  , 4.3.2: 4uirements Req *)
  /Failed (Passshipd internomplete for comeutcl oSet fina
   *  /**}

   }
  )
     }essage 
   r: error.m erro,
       ip'shl interno canceFailed tsage: '   mes   ror({ 
  lServerErse.internaeturn respon
      r {r)rroch (e}
    } cat  
    oISO()e.now().tDateTimtedAt:        updat,
 un successCoRecords:ated
        updcel',: 'doc.canewStatus
        ntEnrollId,en     studcords`,
   ssCount} re for ${succefullyccesssup cancelled nshi`Inter  message:      {
  rn  retugth

    ).lenresultr(result => sults.filtessCount = rest succe      conses)
atePromill(updromise.ats = await Ponst resul
      c  })
     )
     n'
  cellatioive canistratindmn || 'Aso         rea
 r.id,tUse curren    el',
     canc       'doc.nTo(
   .transitio recordrn await        retu=> {
) ecordmap(async (rtusRecords.ses = stadatePromionst up      ccancelled
 records to ll status/ Update a     /  }

          })
   
d' cellebe canips can ed internsh'Only approv  message:    { 
     t(.badReques responseturn       re) {
 s)rrentStatuincludes(cu.approved']. 'doced',(!['c.approv    if Records)
  tatusus(sverallStats.determineOtus = thicurrentStat 
      consledn be cancelthat cate roved stais in an appternship  if inckhe
      // C
      }
})       ent' 
 this enrollmnd for  records foutus: 'No sta message 
         und({tFoesponse.no return r
        0) {h ===ords.lengttusRec    if (sta

  lId)studentEnrololl_id', nrt_euden('st   .where  y()
   .quertustatEnrollS Studends = awaitusRecoronst stat     cnrollment
 r this e foatus records all st  // Find}

    
      d' })requireication uthent message: 'Aorized({nauthse.uturn respon
        reentUser) { if (!curr
    