import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  CourseYearInterface,
  CourseSemesterInterface,
  CourseSectionInterface,
  CourseInterface,
  CourseInstructor,
  CourseCommittee,
  CourseDTO,
  CourseInstructorDTO,
} from "./type";
import type { AxiosResponse } from "axios";

export class CourseService extends RemoteA {
  reqGetCourses = async (): Promise<CourseInterface[]> => {
    const response = await this.getAxiosInstance().get(PROTECTED_PATH.COURSE);
    const { data } = response;
    return data;
  };
  reqGetCourseYears = async (): Promise<CourseYearInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.COURSE_SERCH
    );
    const { data } = response;
    return data;
  };

  reqGetCourseSemesters = async (
    year: number
  ): Promise<CourseSemesterInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.COURSE_SERCH + `?year=${year}`
    );
    const { data } = response;
    return data;
  };

  reqGetCourseSectionsById = async (
    year: number,
    semester: number
  ): Promise<CourseSectionInterface<CourseInterface>[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.COURSE_SERCH + `?year=${year}&semester=${semester}`
    );
    const { data } = response;
    return data;
  };

  reqGetCourseSections = async (): Promise<
    CourseSectionInterface<CourseInterface>[]
  > => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.COURSE_SECTION
    );
    const { data } = response;
    return data;
  };

  reqPostCourseSections = async (entity: CourseDTO): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.COURSE_SECTION,
      entity
    );
    const { data } = response;
    return data;
  };
  reqDeleteCourseSections = async (id: number): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().delete(
      PROTECTED_PATH.COURSE_SECTION + `/${id}`
    );
    const { data } = response;
    return data;
  };
  reqGetCourseInstructor = async (): Promise<CourseInstructor[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.COURSE_INSTRUCTOR
    );
    const { data } = response;
    return data;
  };
  reqPostCourseInstructor = async (
    entity: CourseInstructorDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.COURSE_INSTRUCTOR,
      entity
    );
    const { data } = response;
    return data;
  };

  reqDeleteCourseInstructor = async (
    course_id: number,
    instructor_id: number
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().delete(
      PROTECTED_PATH.COURSE_INSTRUCTOR + `/${course_id}/${instructor_id}`
    );
    const { data } = response;
    return data;
  };

  reqGetCourseCommittee = async (): Promise<CourseCommittee[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.COURSE_COMMITTEE
    );
    const { data } = response;
    return data;
  };

  reqPostCourseCommittee = async (
    entity: CourseInstructorDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.COURSE_COMMITTEE,
      entity
    );
    const { data } = response;
    return data;
  };

  reqDeleteCourseCommittee = async (
    course_id: number,
    instructor_id: number
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().delete(
      PROTECTED_PATH.COURSE_COMMITTEE + `/${course_id}/${instructor_id}`
    );
    const { data } = response;
    return data;
  };
}
