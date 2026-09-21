import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../app/navigation';
import type { UploadConfirmResponse, UploadCourseInfo } from '../../../types';

export function resolveUploadRedirect(
  apiResponse: UploadConfirmResponse,
  courseInfo: UploadCourseInfo,
) {
  const parsedNum = courseInfo.courseNumber ? parseInt(courseInfo.courseNumber, 10) : undefined;
  const targetCourseId =
    apiResponse.course_id ??
    courseInfo.courseId ??
    (parsedNum != null && !isNaN(parsedNum) ? parsedNum : undefined);

  if (targetCourseId == null) {
    return null;
  }

  return {
    path: ROUTES.courseDetail(targetCourseId),
    state: {
      importSuccess: true,
      importMessage: apiResponse.message ?? 'Data imported successfully!',
    },
  };
}

describe('resolveUploadRedirect', () => {
  it('redirects to the course ID returned by the API', () => {
    const response: UploadConfirmResponse = {
      status: 'success',
      message: 'Successfully imported 15 records.',
      course_id: 3545,
    };
    const courseInfo: UploadCourseInfo = {
      courseId: null,
      courseNumber: '3545',
      courseName: 'SE Tools Lab',
      ects: '6',
      attemptType: 'Exam 1',
      semester: 'WiSe 2024/25',
    };

    const redirect = resolveUploadRedirect(response, courseInfo);
    expect(redirect).not.toBeNull();
    expect(redirect?.path).toBe('/courses/3545');
    expect(redirect?.state.importSuccess).toBe(true);
    expect(redirect?.state.importMessage).toBe('Successfully imported 15 records.');
  });

  it('redirects to the pre-existing handoff courseId when API omits course_id', () => {
    const response: UploadConfirmResponse = {
      status: 'success',
      message: 'Imported records.',
    };
    const courseInfo: UploadCourseInfo = {
      courseId: 101,
      courseNumber: '101',
      courseName: 'Algorithms',
      ects: '6',
      attemptType: 'Exam 1',
      semester: 'SoSe 2024',
    };

    const redirect = resolveUploadRedirect(response, courseInfo);
    expect(redirect).not.toBeNull();
    expect(redirect?.path).toBe('/courses/101');
    expect(redirect?.state.importSuccess).toBe(true);
    expect(redirect?.state.importMessage).toBe('Imported records.');
  });

  it('falls back to parsed courseNumber if courseId is null and API returns no course_id', () => {
    const response: UploadConfirmResponse = {
      status: 'success',
    };
    const courseInfo: UploadCourseInfo = {
      courseId: null,
      courseNumber: '999',
      courseName: 'Databases',
      ects: '6',
      attemptType: 'Other',
      semester: 'WiSe 2023/24',
    };

    const redirect = resolveUploadRedirect(response, courseInfo);
    expect(redirect).not.toBeNull();
    expect(redirect?.path).toBe('/courses/999');
    expect(redirect?.state.importSuccess).toBe(true);
    expect(redirect?.state.importMessage).toBe('Data imported successfully!');
  });

  it('returns null if neither API nor courseInfo provides a valid course ID', () => {
    const response: UploadConfirmResponse = {
      status: 'success',
    };
    const courseInfo: UploadCourseInfo = {
      courseId: null,
      courseNumber: 'invalid-non-numeric',
      courseName: 'Unknown',
      ects: '6',
      attemptType: 'Other',
      semester: 'WiSe 2023/24',
    };

    const redirect = resolveUploadRedirect(response, courseInfo);
    expect(redirect).toBeNull();
  });
});
